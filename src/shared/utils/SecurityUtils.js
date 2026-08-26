import config from "../config/index.js";

class SecurityUtils {
  static PASSWORD_REQUIREMENTS = {
    min_length: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    requireUpperCase: process.env.PASSWORD_REQUIRE_UPPERCASE === "true" || true,
    requireLowerCase: process.env.PASSWORD_REQUIRE_LOWERCASE === "true" || true,
    requireNumber: process.env.PASSWORD_REQUIRE_NUMBER === "true" || true,
    requireSpecialChar:
      process.env.PASSWORD_REQUIRE_SPECIAL_CHAR === "true" || true,
  };

  static validatePassword(password) {
    const errors = [];
    const requirements = this.PASSWORD_REQUIREMENTS;

    if (!password) {
      return {
        success: false,
        errors: ["Password is required"],
      };
    }

    if (password.length < requirements.min_length) {
      errors.push(
        `Password must be at least ${requirements.min_length} characters long`,
      );
    }

    if (requirements.requireUpperCase && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (requirements.requireLowerCase && !/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (requirements.requireNumber && !/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (
      requirements.requireSpecialChar &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      errors.push("Password must contain at least one special character");
    }

    //check for weak passwords
    const weakPasswords = [
        "password",
        "123456",
        "123456789",
        "qwerty",
        "abc123",
        "password1",
        "111111",
        "12345678",
        "iloveyou",
        "admin",
      ];

      if(weakPasswords.includes(password.toLowerCase()))
      {
        errors.push("Password is too weak");
      }

     return {
            success:errors.length === 0,
            errors,
            strength:this.CalculatePasswordStrength(password)
           }
    }


  


  static CalculatePasswordStrength(password) {
    if(!password)
    {
        return "weak";
    }

    let score = 0;

    if(password.length>=8) score+=1;
    if(/[A-Z]/.test(password)) score+=1;
    if(/[a-z]/.test(password)) score+=1;
    if(/[0-9]/.test(password)) score+=1;
    if(/[!@#$%^&*(),.?":{}|<>]/.test(password)) score+=1;

    if(score<=2) return "weak";
    else if(score===3 || score===4) return "medium";
    else return "strong";

  }

  static generateToken(user)
  {
    const {_id,email,username,role,clientId}=user;
    const payload={_id,email,username,role,clientId};
    

    return jwt.sign(payload,config.jwt.secret,{expiresIn:config.jwt.expiresIn});
  }
}

export default SecurityUtils;
