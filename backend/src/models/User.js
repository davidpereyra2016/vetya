import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    username:{
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password:{
        type: String,
        required: true,
        minLength: 6
    },
    profilePicture:{
        type: String,
        default: ""
    },
    // Campo de rol para diferenciar tipos de usuarios
    role: {
        type: String,
        enum: ['client', 'provider', 'admin'],
        default: 'client'
    },
    // Ubicación actual del cliente (para emergencias)
    ubicacionActual: {
        coordinates: {
            lat: Number,
            lng: Number
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    // Campos para recuperación de contraseña
    ubicacionActualGeo: {
        type: {
            type: String,
            enum: ["Point"]
        },
        coordinates: {
            type: [Number],
            default: undefined
        }
    },
    resetPasswordToken: {
        type: String,
        default: undefined
    },
    resetPasswordExpires: {
        type: Date,
        default: undefined
    },
    // Verificación de email
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationCode: {
        type: String,
        default: undefined
    },
    emailVerificationExpires: {
        type: Date,
        default: undefined
    },
    // Token de dispositivo para notificaciones push
    deviceToken: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});
// hashear la contraseña despues de guardar en la base de datos
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ resetPasswordToken: 1, resetPasswordExpires: 1 });
userSchema.index({ emailVerificationCode: 1, emailVerificationExpires: 1 });
userSchema.index({ ubicacionActualGeo: "2dsphere" }, { sparse: true });

userSchema.pre("save", function(next) {
    const lat = this.ubicacionActual?.coordinates?.lat;
    const lng = this.ubicacionActual?.coordinates?.lng;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
        this.ubicacionActualGeo = { type: "Point", coordinates: [lng, lat] };
    } else {
        this.ubicacionActualGeo = undefined;
    }
    next();
});

userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password);
}

const User = mongoose.model("User", userSchema);
export default User;
