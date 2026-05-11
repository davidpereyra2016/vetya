import Prestador from "../models/Prestador.js";
import Pago from "../models/Pago.js";

export const CASH_COMMISSION_PERCENTAGE = 0.3;

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

export function getCashDebtPaymentInstructions(prestador = null) {
  return {
    alias:
      prestador?.wallet?.cashDebtPaymentAlias ||
      process.env.CASH_DEBT_PAYMENT_ALIAS ||
      "davidpereyra.mercado",
    link:
      prestador?.wallet?.cashDebtPaymentLink ||
      process.env.CASH_DEBT_PAYMENT_LINK ||
      "",
  };
}

export function getProviderCashStatus(prestador) {
  const cashDebt = roundMoney(prestador?.wallet?.cashDebt || 0);
  const canAcceptCash = cashDebt <= 0 && prestador?.wallet?.canAcceptCash !== false;

  return {
    cashDebt,
    cash_debt: cashDebt,
    canAcceptCash,
    can_accept_cash: canAcceptCash,
    cashDebtPayment: getCashDebtPaymentInstructions(prestador),
  };
}

export async function assertPrestadorCanAcceptCash(prestadorId) {
  const prestador = await Prestador.findById(prestadorId).select(
    "wallet nombre tipo activo"
  );

  if (!prestador) {
    const error = new Error("Prestador no encontrado");
    error.status = 404;
    throw error;
  }

  const cashStatus = getProviderCashStatus(prestador);
  if (!cashStatus.canAcceptCash) {
    const error = new Error(
      "Este prestador tiene una deuda pendiente con VetYa y no puede recibir nuevos pagos en efectivo por ahora."
    );
    error.status = 409;
    error.code = "CASH_DISABLED_DEBT";
    error.cashStatus = cashStatus;
    throw error;
  }

  return { prestador, cashStatus };
}

export async function registerCashDebtForPayment(pagoInput) {
  if (!pagoInput?._id) return null;

  const pago = await Pago.findById(pagoInput._id);
  if (!pago || pago.metodoPago !== "Efectivo") return null;
  if (!["Pagado", "Capturado", "Completado"].includes(pago.estado)) return null;
  if (pago.cashDebt?.recordedAt) return pago.cashDebt;

  const prestador = await Prestador.findById(pago.prestador).select("wallet");
  if (!prestador) return null;

  const amount = roundMoney(pago.monto);
  const platformFee = roundMoney(amount * CASH_COMMISSION_PERCENTAGE);
  const instructions = getCashDebtPaymentInstructions(prestador);

  pago.cashDebt = {
    platformFee,
    providerCollected: amount,
    percentage: CASH_COMMISSION_PERCENTAGE,
    status: "Pendiente",
    recordedAt: new Date(),
    paymentAlias: instructions.alias,
    paymentLink: instructions.link,
  };

  await Prestador.findByIdAndUpdate(pago.prestador, {
    $inc: { "wallet.cashDebt": platformFee },
    $set: {
      "wallet.canAcceptCash": false,
      "wallet.cashDebtUpdatedAt": new Date(),
    },
  });

  await pago.save();
  return pago.cashDebt;
}

export async function markCashDebtAsPaid(prestadorId, { amount = null } = {}) {
  const prestador = await Prestador.findById(prestadorId).select("wallet");
  if (!prestador) {
    const error = new Error("Prestador no encontrado");
    error.status = 404;
    throw error;
  }

  const currentDebt = roundMoney(prestador.wallet?.cashDebt || 0);
  const amountToPay = amount === null ? currentDebt : Math.min(roundMoney(amount), currentDebt);
  const remainingDebt = roundMoney(Math.max(currentDebt - amountToPay, 0));
  const now = new Date();

  prestador.wallet = {
    ...(prestador.wallet?.toObject ? prestador.wallet.toObject() : prestador.wallet),
    cashDebt: remainingDebt,
    canAcceptCash: remainingDebt <= 0,
    cashDebtUpdatedAt: now,
    cashDebtLastPaidAt: now,
  };
  await prestador.save();

  if (remainingDebt <= 0) {
    await Pago.updateMany(
      {
        prestador: prestador._id,
        metodoPago: "Efectivo",
        "cashDebt.status": "Pendiente",
      },
      {
        $set: {
          "cashDebt.status": "Pagada",
          "cashDebt.paidAt": now,
        },
      }
    );
  }

  return getProviderCashStatus(prestador);
}
