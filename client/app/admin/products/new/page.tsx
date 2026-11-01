"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ProductForm } from "@/components/admin/product-form";
import { createAdminProduct } from "@/services/adminService";

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (payload: any) => {
    setIsSubmitting(true);
    try {
      await createAdminProduct(payload);
      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(err.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProductForm
      pageTitle="CREATE NEW PRODUCT / MEN'S FOOTWEAR"
      onSubmit={handleCreate}
      isSubmitting={isSubmitting}
    />
  );
}
