import prisma from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  generateOTP,
  generateVerificationCode,
} from "./email.service.js";

export async function registerUser(userData) {
  const {
    email,
    password,
    name,
    role = "USER",
    firstName,
    lastName,
    displayName,
    phone,
    postcode,
    address,
    bio,
    // Sport Provider (COACH) fields
    organizationName,
    sessionType,
    sportsOffered,
    // Service Provider (PROVIDER) fields
    serviceTypes,
    aboutOrganization,
    // Regular User fields
    sportsInterests,
    ageRange,
  } = userData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw { statusCode: 409, message: "User with this email already exists" };
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Prepare user data based on role
  const userData_create = {
    email,
    password: hashedPassword,
    name,
    role,
    isEmailVerified: true, // No email verification required
    emailVerifyToken: null,
    // Common fields
    firstName,
    lastName,
    displayName,
    phone,
    postcode,
    address,
    bio,
    ageRange,
  };

  // Add role-specific fields
  if (role === "COACH") {
    userData_create.organizationName = organizationName;
    userData_create.sessionType = sessionType;
    userData_create.sportsOffered = sportsOffered || [];
    userData_create.aboutOrganization = aboutOrganization;
  } else if (role === "PROVIDER") {
    userData_create.organizationName = organizationName;
    userData_create.serviceTypes = serviceTypes || [];
    userData_create.aboutOrganization = aboutOrganization;
  } else if (role === "USER") {
    userData_create.sportsInterests = sportsInterests || [];
  }

  const user = await prisma.user.create({
    data: userData_create,
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      displayName: true,
      role: true,
      status: true,
      phone: true,
      postcode: true,
      organizationName: true,
      sessionType: true,
      sportsOffered: true,
      serviceTypes: true,
      sportsInterests: true,
      isEmailVerified: true,
      createdAt: true,
      ageRange: true,
    },
  });

  // No email verification required
  const token = generateToken(user.id);


  return {
    user,
    token,
    message: "Registration successful. You can now login.",
  };
}
export async function loginUser(credentials) {
  const { email, password } = credentials;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw { statusCode: 401, message: "Invalid email or password" };
  }

  // Check password
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw { statusCode: 401, message: "Invalid email or password" };
  }

  // Check if user is active
  if (user.status !== "ACTIVE") {
    throw { statusCode: 403, message: "User account is not active" };
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLogin: new Date(),
    },
  });

  const token = generateToken(user.id);

  // Remove password from response and add lastLogin
  const { password: _, ...userWithoutPassword } = user;
  userWithoutPassword.lastLogin = new Date();

  return { user: userWithoutPassword, token };
}
export async function verifyEmail(email, code) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  if (user.isEmailVerified) {
    throw { statusCode: 400, message: "Email already verified" };
  }

  if (user.emailVerifyToken !== code) {
    throw { statusCode: 400, message: "Invalid verification code" };
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      isEmailVerified: true,
      emailVerifyToken: null,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      isEmailVerified: true,
    },
  });

  return updatedUser;
}

export async function resendVerificationEmail(email) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  if (user.isEmailVerified) {
    throw { statusCode: 400, message: "Email already verified" };
  }

  // Generate new verification code
  const verificationCode = generateVerificationCode();

  await prisma.user.update({
    where: { email },
    data: {
      emailVerifyToken: verificationCode,
    },
  });

  // Send verification email
  await sendVerificationEmail(email, user.name, verificationCode);

  return { message: "Verification email sent successfully" };
}



export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists or not for security
    return { message: "If the email exists, an OTP has been sent" };
  }

  // Generate OTP
  const otp = generateOTP();

  // Set expiry time (10 minutes from now)
  const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

  // Update user with reset token
  await prisma.user.update({
    where: { email },
    data: {
      resetPasswordToken: otp,
      resetPasswordExpires: expiryTime,
    },
  });


  try {
    await sendPasswordResetEmail(email, user.name, otp);
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    throw { statusCode: 500, message: "Failed to send reset email" };
  }

  return { message: "OTP sent to your email address" };
}

export async function verifyOTP(email, otp) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  if (!user.resetPasswordToken) {
    throw { statusCode: 400, message: "No password reset request found" };
  }

  if (user.resetPasswordToken !== otp) {
    throw { statusCode: 400, message: "Invalid OTP" };
  }

  if (user.resetPasswordExpires < new Date()) {
    throw { statusCode: 400, message: "OTP has expired" };
  }

  return { message: "OTP verified successfully", email: user.email };
}

export async function resetPassword(email, otp, newPassword) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  if (!user.resetPasswordToken) {
    throw { statusCode: 400, message: "No password reset request found" };
  }

  if (user.resetPasswordToken !== otp) {
    throw { statusCode: 400, message: "Invalid OTP" };
  }

  // Check if OTP expired
  if (user.resetPasswordExpires < new Date()) {
    throw { statusCode: 400, message: "OTP has expired" };
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  // Send confirmation email
  try {
    await sendPasswordResetConfirmation(email, user.name);
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
  }

  return { message: "Password reset successful" };
}

export async function changePassword(userId, currentPassword, newPassword) {
  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    throw { statusCode: 401, message: "Current password is incorrect" };
  }

  const isSamePassword = await comparePassword(newPassword, user.password);
  if (isSamePassword) {
    throw {
      statusCode: 400,
      message: "New password must be different from current password",
    };
  }

  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });

  return { message: "Password changed successfully" };
}

export async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      avatar: true,
      phone: true,
      bio: true,
      address: true,
      billingAddress: true,
      shippingAddress: true,
      isEmailVerified: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      // Common fields for all roles
      firstName: true,
      lastName: true,
      displayName: true,
      postcode: true,
      // Sport Provider (COACH) specific fields
      organizationName: true,
      sessionType: true,
      sportsOffered: true,
      aboutOrganization: true,
      // Service Provider (PROVIDER) specific fields
      serviceTypes: true,
      // Regular User specific fields
      sportsInterests: true,
    },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  return user;
}
