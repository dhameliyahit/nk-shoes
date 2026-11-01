"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RiArrowLeftLine, RiAlertLine } from "react-icons/ri";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProductById, updateAdminProduct } from "@/services/adminService";
import { Product } from "@/types/product";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAdminProductById(id);
        if (isMounted) setProduct(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load product");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleUpdate = async (payload: any) => {
    setIsSubmitting(true);
    try {
      await updateAdminProduct(id, payload);
      toast.success("Product updated successfully!");
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(err.message || "Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin rounded-none" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#6B7280]">
          Loading product dossier...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-white border border-[#FCA5A5] p-8 text-center max-w-xl mx-auto my-12">
        <RiAlertLine className="text-4xl text-[#DC2626] mx-auto mb-3" />
        <h3 className="text-base font-bold uppercase tracking-tight text-[#111111]">
          Product Not Found
        </h3>
        <p className="text-xs text-[#6B7280] mt-1 mb-6">
          {error || "The product requested could not be located in catalog records."}
        </p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors rounded-none"
        >
          <RiArrowLeftLine className="text-sm" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <ProductForm
      key={product._id || product.id}
      initialData={product}
      pageTitle={`EDIT PRODUCT / ${product.name}`}
      onSubmit={handleUpdate}
      isSubmitting={isSubmitting}
    />
  );
}
