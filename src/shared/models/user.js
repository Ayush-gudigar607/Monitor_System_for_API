import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import SecurityUtils from "../utils/SecurityUtils.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      validate: {
        validator: function (username) {
          return /^[a-zA-Z0-9_-]+$/.test(username); //test the regex for valid username (alphanumeric, underscores, hyphens)
        },
        message: "Please enter a valid username ",
      },
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (email) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); //regex for valid email
        },
        message: "Please enter a valid email address",
      },
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      validate: {
        validator: function (password) {
          if (
            this.isModified("password") &&
            password &&
            !password.startsWith("$2b$")
          ) //password always starts with $2b$ (password is not hashed before)
          {
            const validation = SecurityUtils.validatePassword(password);
            return validation.success;
          }
          return true; //if password is not modified or already hashed, skip validation
        },
        // this will execute only if the password is modified and not hashed before, it will validate the password and return the error message if the validation fails
        message: function (password) {
          if (password && !password.startsWith("$2b$")) {
            const validation = SecurityUtils.validatePassword(password);
            return validation.errors.join(", ");
          }

          return "Password validation failed";
        },
      },
    },

    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "USER"],
      default: "USER",
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: function () {
        return this.role !== "SUPER_ADMIN"; //clientId is required for all roles except SUPER_ADMIN
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    permissions: {
      canCreateApiKeys: {
        type: Boolean,
        default: false,
      },

      canManageUsers: {
        type: Boolean,
        default: false,
      },

      canViewAnalytics: {
        type: Boolean,
        default: false,
      },

      canExportData: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    return next(err);
  }
});

userSchema.index({ clientId: 1, isActive: 1 });
userSchema.index({ role: 1 });

const user = mongoose.model("User", userSchema);

export default user;
