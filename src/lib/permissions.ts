export type UserRole = "customer" | "staff" | "owner" | "admin";

export const roleLabel: Record<UserRole, string> = {
  customer: "Khách hàng",
  staff: "Nhân viên",
  owner: "Chủ cửa hàng",
  admin: "Admin",
};

export function canUseChat(role: UserRole | null) {
  return role !== null;
}

export function canBuy(role: UserRole | null) {
  return role === "customer" || role === "staff" || role === "owner";
}

export function canViewOrders(role: UserRole | null) {
  return role === "staff" || role === "owner";
}

export function canConfirmPayment(role: UserRole | null) {
  return role === "staff" || role === "owner";
}

export function canViewLowStock(role: UserRole | null) {
  return role === "staff" || role === "owner";
}

export function canUpdateStock(role: UserRole | null) {
  return role === "staff" || role === "owner";
}

export function canManageComponents(role: UserRole | null) {
  return role === "owner" || role === "admin";
}

export function canAddOrDeleteComponent(role: UserRole | null) {
  return role === "owner" || role === "admin";
}

export function canUpdateComponentInfo(role: UserRole | null) {
  return role === "owner" || role === "admin";
}

export function canUpdateComponentPrice(role: UserRole | null) {
  return role === "owner";
}

export function canUpdateComponentLocation(role: UserRole | null) {
  return role === "owner";
}

export function canViewStatistics(role: UserRole | null) {
  return role === "owner";
}

export function canManageUsers(role: UserRole | null) {
  return role === "admin";
}

export function canAssignRoles(role: UserRole | null) {
  return role === "admin";
}