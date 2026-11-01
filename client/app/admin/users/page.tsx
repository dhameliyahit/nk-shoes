"use client";

import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  RiUserLine,
  RiShieldUserLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiCheckboxCircleFill,
  RiCloseCircleLine,
  RiPhoneLine,
  RiMailLine,
  RiMapPinLine,
  RiExchangeLine,
} from "react-icons/ri";
import { DataTable, Column, FilterOption } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  getAdminUsers,
  updateAdminUserRole,
  deleteAdminUser,
  AdminUser,
} from "@/services/adminService";
import { useAuth } from "@/context/auth-context";

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<string>("all");

  // Role Change Modal / State
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load registered users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (filterTab === "customers") {
      return users.filter((u) => u.role === "user");
    }
    if (filterTab === "admins") {
      return users.filter((u) => u.role === "admin");
    }
    if (filterTab === "verified") {
      return users.filter((u) => u.isVerified);
    }
    return users;
  }, [users, filterTab]);

  const tabCounts = useMemo(() => {
    return {
      all: users.length,
      customers: users.filter((u) => u.role === "user").length,
      admins: users.filter((u) => u.role === "admin").length,
      verified: users.filter((u) => u.isVerified).length,
    };
  }, [users]);

  const filterOptions: FilterOption[] = [
    { label: "ALL USERS", value: "all", count: tabCounts.all },
    { label: "CUSTOMERS", value: "customers", count: tabCounts.customers },
    { label: "ADMINISTRATORS", value: "admins", count: tabCounts.admins },
    { label: "VERIFIED", value: "verified", count: tabCounts.verified },
  ];

  const handleRoleToggle = async () => {
    if (!roleTarget) return;
    const newRole = roleTarget.role === "admin" ? "user" : "admin";
    setIsUpdatingRole(true);
    try {
      await updateAdminUserRole(roleTarget._id, newRole);
      toast.success(
        `User "${roleTarget.name}" role updated to ${newRole.toUpperCase()}`
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === roleTarget._id ? { ...u, role: newRole } : u))
      );
      setRoleTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user role");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminUser(deleteTarget._id);
      toast.success(`User "${deleteTarget.name}" permanently deleted`);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      header: "USER DOSSIER",
      className: "min-w-[240px]",
      render: (item) => {
        const initials = (item.name || "U")
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#111111] text-white flex items-center justify-center font-bold text-xs uppercase font-mono shrink-0 border border-black">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs uppercase tracking-tight text-[#111111] truncate">
                {item.name}
              </span>
              <span className="text-[11px] text-[#6B7280] font-mono truncate flex items-center gap-1">
                <RiMailLine className="text-[10px]" />
                {item.email}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "PHONE",
      render: (item) => (
        <div className="flex items-center gap-1.5 font-mono text-xs text-[#374151]">
          {item.phone ? (
            <>
              <RiPhoneLine className="text-[#9CA3AF]" />
              <span>+91 {item.phone}</span>
            </>
          ) : (
            <span className="text-[#9CA3AF]">—</span>
          )}
        </div>
      ),
    },
    {
      header: "ACCESS ROLE",
      render: (item) => {
        const isAdmin = item.role === "admin";
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
              isAdmin
                ? "bg-[#111111] text-white border-black"
                : "bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]"
            }`}
          >
            {isAdmin ? (
              <>
                <RiShieldUserLine className="text-xs text-[#E53E3E]" />
                <span>ADMIN</span>
              </>
            ) : (
              <>
                <RiUserLine className="text-xs text-[#6B7280]" />
                <span>CUSTOMER</span>
              </>
            )}
          </span>
        );
      },
    },
    {
      header: "VERIFICATION",
      render: (item) => (
        <div className="flex items-center gap-1 text-xs">
          {item.isVerified ? (
            <span className="inline-flex items-center gap-1 text-[#059669] font-bold text-[10px] uppercase font-mono">
              <RiCheckboxCircleFill className="text-xs" />
              <span>VERIFIED</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[#9CA3AF] text-[10px] uppercase font-mono">
              <RiCloseCircleLine className="text-xs" />
              <span>UNVERIFIED</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: "ADDRESSES",
      render: (item) => (
        <span className="font-mono text-xs text-[#4B5563] inline-flex items-center gap-1">
          <RiMapPinLine className="text-xs text-[#9CA3AF]" />
          <span>{item.addresses?.length || 0} saved</span>
        </span>
      ),
    },
    {
      header: "JOINED",
      render: (item) => (
        <span className="font-mono text-[10px] text-[#6B7280]">
          {new Date(item.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      header: "ACTIONS",
      className: "text-right",
      render: (item) => {
        const isSelf = currentAdmin?._id === item._id;
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setRoleTarget(item)}
              title={item.role === "admin" ? "Demote to Customer" : "Promote to Admin"}
              disabled={isSelf}
              className={`p-1.5 border text-xs font-bold uppercase transition-colors rounded-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                item.role === "admin"
                  ? "border-[#D1D5DB] text-[#374151] hover:bg-[#F3F4F6]"
                  : "bg-[#111111] text-white hover:bg-black border-black"
              }`}
            >
              <RiExchangeLine className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(item)}
              disabled={isSelf}
              title={isSelf ? "Cannot delete own active session" : "Delete User Account"}
              className="p-1.5 border border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors rounded-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <RiDeleteBinLine className="text-sm" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111111]">
            Users & Access Control
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Audit customer accounts, manage administrator privileges, and review identity verifications
          </p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#D1D5DB] text-xs font-bold uppercase tracking-wider text-[#374151] hover:border-black hover:text-black transition-colors rounded-none bg-white cursor-pointer self-start sm:self-auto"
        >
          <RiRefreshLine className={isLoading ? "animate-spin text-sm" : "text-sm"} />
          <span>Refresh</span>
        </button>
      </div>

      {/* DATA TABLE */}
      <DataTable<AdminUser>
        data={filteredUsers}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search users by name, email, or phone number..."
        searchFilter={(item, q) =>
          Boolean(
            item.name.toLowerCase().includes(q) ||
            item.email.toLowerCase().includes(q) ||
            (item.phone && item.phone.includes(q))
          )
        }
        filterOptions={filterOptions}
        filterValue={filterTab}
        onFilterChange={setFilterTab}
        pageSize={15}
        emptyMessage="No registered users found matching filter criteria."
      />

      {/* CONFIRM ROLE TOGGLE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(roleTarget)}
        title="MODIFY ACCESS ROLE"
        message={`Are you sure you want to change "${roleTarget?.name}" from ${roleTarget?.role?.toUpperCase()} to ${
          roleTarget?.role === "admin" ? "CUSTOMER (USER)" : "ADMINISTRATOR"
        }? Administrators have full access to orders, finances, and products.`}
        confirmLabel={
          roleTarget?.role === "admin" ? "DEMOTE TO CUSTOMER" : "PROMOTE TO ADMIN"
        }
        isDestructive={roleTarget?.role === "admin"}
        isLoading={isUpdatingRole}
        onConfirm={handleRoleToggle}
        onCancel={() => setRoleTarget(null)}
      />

      {/* CONFIRM DELETE USER DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="DELETE USER ACCOUNT"
        message={`Are you sure you want to permanently delete the account of "${deleteTarget?.name}" (${deleteTarget?.email})? All profile details, saved addresses, and active sessions will be terminated.`}
        confirmLabel="DELETE ACCOUNT"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
