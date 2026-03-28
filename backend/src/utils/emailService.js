import nodemailer from 'nodemailer';

/**
 * Genera un código de verificación de 6 dígitos
 */
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Crea el transporter de nodemailer
 * Si no hay credenciales configuradas, usa un transporter de pruebas (Ethereal)
 */
let gmailTransporter = null;
let etherealTransporter = null;

const getTransporter = async () => {
    // Si hay credenciales de Gmail, usar Gmail (crear una sola vez)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        if (!gmailTransporter) {
            gmailTransporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            console.log('📧 Transporter Gmail configurado para:', process.env.EMAIL_USER);
        }
        return { transport: gmailTransporter, isGmail: true };
    }
    
    // Desarrollo: usar Ethereal (emails de prueba)
    if (!etherealTransporter) {
        const testAccount = await nodemailer.createTestAccount();
        console.log('📧 Usando cuenta de prueba Ethereal para emails');
        console.log('📧 Usuario:', testAccount.user);
        etherealTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
    }
    return { transport: etherealTransporter, isGmail: false };
};

/**
 * Envía el código de verificación por email
 * @param {string} to - Email del destinatario
 * @param {string} code - Código de verificación de 6 dígitos
 * @param {string} username - Nombre del usuario
 */
export const sendVerificationEmail = async (to, code, username = '') => {
    try {
        const { transport, isGmail } = await getTransporter();
        // Gmail requiere que FROM coincida con la cuenta autenticada
        const fromAddress = isGmail 
            ? `VetYa <${process.env.EMAIL_USER}>` 
            : (process.env.EMAIL_FROM || 'VetYa <noreply@vetya.com>');

        const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1E88E5, #1565C0); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🐾 VetYa</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Verificación de correo electrónico</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="color: #333; font-size: 16px;">Hola${username ? ` <strong>${username}</strong>` : ''},</p>
                <p style="color: #555; font-size: 15px;">Tu código de verificación es:</p>
                <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1E88E5;">${code}</span>
                </div>
                <p style="color: #555; font-size: 14px;">Este código expira en <strong>15 minutos</strong>.</p>
                <p style="color: #999; font-size: 13px;">Si no solicitaste este código, puedes ignorar este mensaje.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #aaa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} VetYa - Servicios Veterinarios</p>
            </div>
        </div>`;

        const info = await transport.sendMail({
            from: fromAddress,
            to,
            subject: `${code} - Código de verificación VetYa`,
            html: htmlContent,
            text: `Tu código de verificación de VetYa es: ${code}. Este código expira en 15 minutos.`
        });

        // En desarrollo con Ethereal, mostrar URL de previsualización
        if (!isGmail) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log('📧 [Ethereal] Vista previa del email:', previewUrl);
        }

        console.log(`📧 Email de verificación enviado a ${to} (via ${isGmail ? 'Gmail' : 'Ethereal'})`);
        console.log(`📧 Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error al enviar email de verificación:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Envía el código de recuperación de contraseña por email
 */
export const sendPasswordResetEmail = async (to, code, username = '') => {
    try {
        const { transport, isGmail } = await getTransporter();
        const fromAddress = isGmail 
            ? `VetYa <${process.env.EMAIL_USER}>` 
            : (process.env.EMAIL_FROM || 'VetYa <noreply@vetya.com>');

        const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #FF6B35, #E55100); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🐾 VetYa</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Recuperación de contraseña</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="color: #333; font-size: 16px;">Hola${username ? ` <strong>${username}</strong>` : ''},</p>
                <p style="color: #555; font-size: 15px;">Recibimos una solicitud para restablecer tu contraseña. Tu código es:</p>
                <div style="background: #FFF3E0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #E55100;">${code}</span>
                </div>
                <p style="color: #555; font-size: 14px;">Este código expira en <strong>15 minutos</strong>.</p>
                <p style="color: #999; font-size: 13px;">Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje. Tu cuenta está segura.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #aaa; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} VetYa - Servicios Veterinarios</p>
            </div>
        </div>`;

        const info = await transport.sendMail({
            from: fromAddress,
            to,
            subject: `${code} - Recuperación de contraseña VetYa`,
            html: htmlContent,
            text: `Tu código de recuperación de contraseña de VetYa es: ${code}. Este código expira en 15 minutos.`
        });

        if (!isGmail) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log('📧 [Ethereal] Vista previa del email:', previewUrl);
        }

        console.log(`📧 Email de recuperación enviado a ${to} (via ${isGmail ? 'Gmail' : 'Ethereal'})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error al enviar email de recuperación:', error);
        return { success: false, error: error.message };
    }
};
