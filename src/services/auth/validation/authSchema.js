import { email } from "zod/mini";
import { isValidRole } from "../../../shared/constants/role.js";

const emailpattern=/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export const onboardsuperAdminSchema = {
  username: {
    required: true,
  },
  email: {
    required: true,
    custom: (value) => {
      if (!value) return null;
      return emailPattern.test(value) ? null : "email must be valid";
    },
  },
  password: {
    required: true,
    minLength: 6,
  },
};

export const registerSchema = {
  username: {
    required: true,
  },
  email: {
    required: true,
    custom: (value) => {
      if (!value) return null;
      return emailPattern.test(value) ? null : "email must be valid";
    },
  },
  password: {
    required: true,
    minLength: 6,
  },
  role: {
    required: true,
    validate: (value) => {
      if (!value) return null;
      return isValidRole(value) ? null : "Invalid Role";
    },
  },
};

export const loginSchema = {
    username: {
        required: true,
        type: "string"
    },
    password: {
        required: true,
        type: "string"
    }
};