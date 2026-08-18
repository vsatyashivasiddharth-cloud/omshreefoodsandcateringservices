"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  CalendarClock,
  CheckCircle2,
  Edit3,
  Percent,
  Plus,
  RefreshCw,
  Tags,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  isActive: boolean;
  oneUsePerPhone: boolean;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
}

interface CouponFormData {
  code: string;
  discountPercent: string;
  maxUses: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  oneUsePerPhone: boolean;
}

interface ApiError {
  error?: string;
  message?: string;
}

type CouponStatus =
  | "Scheduled"
  | "Active"
  | "Expired"
  | "Disabled";

const IST_OFFSET_MINUTES =
  5 * 60 + 30;

const emptyForm: CouponFormData = {
  code: "",
  discountPercent: "",
  maxUses: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
  oneUsePerPhone: true,
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4 text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60";

function isCoupon(
  value: unknown,
): value is Coupon {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const item =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof item.id === "string" &&
    typeof item.code === "string" &&
    typeof item.discountPercent ===
      "number" &&
    typeof item.maxUses === "number" &&
    typeof item.isActive ===
      "boolean" &&
    typeof item.oneUsePerPhone ===
      "boolean" &&
    typeof item.startsAt ===
      "string" &&
    typeof item.endsAt ===
      "string" &&
    typeof item.createdAt ===
      "string" &&
    typeof item.updatedAt ===
      "string"
  );
}

function formatNumber(
  value: number,
) {
  return value.toLocaleString(
    "en-IN",
  );
}

function formatPercent(
  value: number,
) {
  return `${value.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  )}%`;
}

function formatIstDateTime(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone:
        "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  ).format(date);
}

function isoToIstInput(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  const shifted =
    new Date(
      date.getTime() +
        IST_OFFSET_MINUTES *
          60_000,
    );

  return shifted
    .toISOString()
    .slice(0, 16);
}

function istInputToIso(
  value: string,
) {
  const normalized =
    value.trim();

  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(
      normalized,
    )
  ) {
    return null;
  }

  const date =
    new Date(
      `${normalized}:00+05:30`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function getCouponStatus(
  coupon: Coupon,
): CouponStatus {
  if (!coupon.isActive) {
    return "Disabled";
  }

  const now =
    Date.now();

  const start =
    new Date(
      coupon.startsAt,
    ).getTime();

  const end =
    new Date(
      coupon.endsAt,
    ).getTime();

  if (now < start) {
    return "Scheduled";
  }

  if (now > end) {
    return "Expired";
  }

  return "Active";
}

function getStatusClassName(
  status: CouponStatus,
) {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-800";

    case "Scheduled":
      return "bg-blue-100 text-blue-800";

    case "Expired":
      return "bg-amber-100 text-amber-800";

    case "Disabled":
      return "bg-gray-100 text-gray-600";
  }
}

function formFromCoupon(
  coupon: Coupon,
): CouponFormData {
  return {
    code:
      coupon.code,

    discountPercent:
      String(
        coupon.discountPercent,
      ),

    maxUses:
      String(
        coupon.maxUses,
      ),

    startsAt:
      isoToIstInput(
        coupon.startsAt,
      ),

    endsAt:
      isoToIstInput(
        coupon.endsAt,
      ),

    isActive:
      coupon.isActive,

    oneUsePerPhone:
      coupon.oneUsePerPhone,
  };
}

function validateForm(
  form: CouponFormData,
) {
  const code =
    form.code.trim();

  if (
    code.length < 2 ||
    code.length > 50 ||
    !/^[A-Za-z0-9_-]+$/.test(
      code,
    )
  ) {
    return "Coupon code must be between 2 and 50 characters and may contain only letters, numbers, hyphens and underscores.";
  }

  const discountPercent =
    Number(
      form.discountPercent,
    );

  if (
    !Number.isFinite(
      discountPercent,
    ) ||
    discountPercent <= 0 ||
    discountPercent > 100
  ) {
    return "Discount percentage must be greater than 0 and no more than 100.";
  }

  const maxUses =
    Number(
      form.maxUses,
    );

  if (
    !Number.isInteger(
      maxUses,
    ) ||
    maxUses < 1 ||
    maxUses > 1_000_000
  ) {
    return "Maximum customers must be a whole number between 1 and 1000000.";
  }

  const startsAt =
    istInputToIso(
      form.startsAt,
    );

  const endsAt =
    istInputToIso(
      form.endsAt,
    );

  if (!startsAt) {
    return "Enter a valid coupon start date and time.";
  }

  if (!endsAt) {
    return "Enter a valid coupon end date and time.";
  }

  if (
    new Date(
      startsAt,
    ).getTime() >=
    new Date(
      endsAt,
    ).getTime()
  ) {
    return "Coupon end date and time must be after the start date and time.";
  }

  return null;
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#F0D5A2] bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold text-[#6D2E00]">
            {value}
          </p>
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C89B3C]">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminCouponsPage() {
  const [
    coupons,
    setCoupons,
  ] = useState<Coupon[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState<
    string | null
  >(null);

  const [
    statusChangingId,
    setStatusChangingId,
  ] = useState("");

  const [
    deletingId,
    setDeletingId,
  ] = useState("");

  const [
    form,
    setForm,
  ] = useState<CouponFormData>(
    emptyForm,
  );

  const loadCoupons =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/admin/coupons",
            {
              method: "GET",
              cache: "no-store",
            },
          );

        const data: unknown =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          const error =
            data &&
            typeof data ===
              "object" &&
            !Array.isArray(data)
              ? (data as ApiError)
              : null;

          throw new Error(
            error?.error ||
              error?.message ||
              "Unable to load coupons.",
          );
        }

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid coupons response.",
          );
        }

        setCoupons(
          data.filter(
            isCoupon,
          ),
        );
      } catch (error) {
        console.error(
          "Coupon loading error:",
          error,
        );

        setCoupons([]);

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load coupons.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  const stats =
    useMemo(() => {
      const statuses =
        coupons.map(
          getCouponStatus,
        );

      return {
        total:
          coupons.length,

        active:
          statuses.filter(
            (status) =>
              status === "Active",
          ).length,

        scheduled:
          statuses.filter(
            (status) =>
              status ===
              "Scheduled",
          ).length,

        expired:
          statuses.filter(
            (status) =>
              status === "Expired",
          ).length,

        disabled:
          statuses.filter(
            (status) =>
              status ===
              "Disabled",
          ).length,
      };
    }, [coupons]);

  function updateField<
    K extends keyof CouponFormData,
  >(
    field: K,
    value: CouponFormData[K],
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function openCreateModal() {
    setEditingId(null);

    setForm(
      emptyForm,
    );

    setModalOpen(true);
  }

  function openEditModal(
    coupon: Coupon,
  ) {
    if (
      deletingId ===
      coupon.id
    ) {
      return;
    }

    setEditingId(
      coupon.id,
    );

    setForm(
      formFromCoupon(
        coupon,
      ),
    );

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingId(null);

    setForm(
      emptyForm,
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const validationError =
      validateForm(form);

    if (validationError) {
      toast.error(
        validationError,
      );

      return;
    }

    const startsAt =
      istInputToIso(
        form.startsAt,
      );

    const endsAt =
      istInputToIso(
        form.endsAt,
      );

    if (
      !startsAt ||
      !endsAt
    ) {
      toast.error(
        "Enter a valid coupon schedule.",
      );

      return;
    }

    setSaving(true);

    try {
      const payload = {
        /*
         * Preserve the administrator's
         * exact letter casing.
         */
        code:
          form.code.trim(),

        discountPercent:
          Number(
            form.discountPercent,
          ),

        maxUses:
          Number(
            form.maxUses,
          ),

        startsAt,
        endsAt,

        isActive:
          form.isActive,

        oneUsePerPhone:
          form.oneUsePerPhone,
      };

      const url =
        editingId
          ? `/api/admin/coupons/${editingId}`
          : "/api/admin/coupons";

      const response =
        await fetch(
          url,
          {
            method:
              editingId
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        );

      const data: unknown =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        const error =
          data &&
          typeof data ===
            "object" &&
          !Array.isArray(data)
            ? (data as ApiError)
            : null;

        throw new Error(
          error?.error ||
            error?.message ||
            "Unable to save coupon.",
        );
      }

      toast.success(
        editingId
          ? "Coupon updated."
          : "Coupon created.",
      );

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadCoupons();
    } catch (error) {
      console.error(
        "Coupon save error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save coupon.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCouponStatus(
    coupon: Coupon,
  ) {
    if (
      deletingId ===
      coupon.id
    ) {
      return;
    }

    const nextIsActive =
      !coupon.isActive;

    const confirmed =
      window.confirm(
        nextIsActive
          ? `Enable coupon "${coupon.code}"? Its schedule will still determine when customers can use it.`
          : `Disable coupon "${coupon.code}"? Customers will no longer be able to use it until you enable it again.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setStatusChangingId(
        coupon.id,
      );

      const response =
        await fetch(
          `/api/admin/coupons/${coupon.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                isActive:
                  nextIsActive,
              }),
          },
        );

      const data: unknown =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        const error =
          data &&
          typeof data ===
            "object" &&
          !Array.isArray(data)
            ? (data as ApiError)
            : null;

        throw new Error(
          error?.error ||
            error?.message ||
            "Unable to update coupon status.",
        );
      }

      setCoupons(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              coupon.id
                ? {
                    ...item,
                    isActive:
                      nextIsActive,
                  }
                : item,
          ),
      );

      toast.success(
        nextIsActive
          ? "Coupon enabled."
          : "Coupon disabled.",
      );
    } catch (error) {
      console.error(
        "Coupon status error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update coupon status.",
      );
    } finally {
      setStatusChangingId("");
    }
  }

  async function deleteCoupon(
    coupon: Coupon,
  ) {
    if (
      deletingId ||
      statusChangingId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete coupon "${coupon.code}" permanently?\n\nThis action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        coupon.id,
      );

      const response =
        await fetch(
          `/api/admin/coupons/${coupon.id}`,
          {
            method: "DELETE",
          },
        );

      const data: unknown =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        const error =
          data &&
          typeof data ===
            "object" &&
          !Array.isArray(data)
            ? (data as ApiError)
            : null;

        throw new Error(
          error?.error ||
            error?.message ||
            "Unable to delete coupon.",
        );
      }

      setCoupons(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              coupon.id,
          ),
      );

      toast.success(
        "Coupon deleted.",
      );
    } catch (error) {
      console.error(
        "Coupon delete error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to delete coupon.",
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF9F0] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#F0D5A2] bg-white/95 p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C89B3C]">
                Offers Management
              </p>

              <h1 className="mt-3 text-3xl font-bold text-[#6D2E00] sm:text-4xl">
                Coupons
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-gray-600">
                Create scheduled percentage
                discount offers, control their
                customer limits and choose
                whether each mobile number may
                use an offer only once.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  void loadCoupons()
                }
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#E7C98C] bg-white px-5 font-semibold text-[#6D2E00] transition hover:bg-[#FFF8EE] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  aria-hidden="true"
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#6D2E00] px-5 font-semibold text-white transition hover:bg-[#8B3A00]"
              >
                <Plus
                  size={18}
                  aria-hidden="true"
                />
                Add Coupon
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total Coupons"
            value={stats.total}
            icon={
              <Tags
                size={24}
                aria-hidden="true"
              />
            }
          />

          <StatCard
            title="Active"
            value={stats.active}
            icon={
              <CheckCircle2
                size={24}
                aria-hidden="true"
              />
            }
          />

          <StatCard
            title="Scheduled"
            value={stats.scheduled}
            icon={
              <CalendarClock
                size={24}
                aria-hidden="true"
              />
            }
          />

          <StatCard
            title="Expired"
            value={stats.expired}
            icon={
              <XCircle
                size={24}
                aria-hidden="true"
              />
            }
          />

          <StatCard
            title="Disabled"
            value={stats.disabled}
            icon={
              <XCircle
                size={24}
                aria-hidden="true"
              />
            }
          />
        </div>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#F0D5A2] bg-white shadow-xl">
          <div className="border-b border-[#F3DFC2] px-6 py-5 sm:px-8">
            <h2 className="text-xl font-bold text-[#6D2E00]">
              Coupon Offers
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              All schedule times below are
              displayed in India Standard
              Time (IST).
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading coupons...
            </div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center">
              <Tags
                size={48}
                className="mx-auto text-[#C89B3C]"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-xl font-bold text-[#6D2E00]">
                No Coupons Yet
              </h3>

              <p className="mt-2 text-gray-500">
                Create your first coupon
                offer when you are ready.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px]">
                <thead className="bg-[#FFF8EE]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Coupon
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Discount
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Max Customers
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Validity
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Mobile Rule
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {coupons.map(
                    (coupon) => {
                      const status =
                        getCouponStatus(
                          coupon,
                        );

                      const isDeleting =
                        deletingId ===
                        coupon.id;

                      const isChangingStatus =
                        statusChangingId ===
                        coupon.id;

                      return (
                        <tr
                          key={
                            coupon.id
                          }
                          className="border-t border-[#F3DFC2]"
                        >
                          <td className="px-6 py-5">
                            <p className="font-mono text-base font-bold text-[#6D2E00]">
                              {
                                coupon.code
                              }
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Exact,
                              case-sensitive
                              code
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 font-bold text-[#6D2E00]">
                              <Percent
                                size={17}
                                className="text-[#C89B3C]"
                                aria-hidden="true"
                              />

                              {formatPercent(
                                coupon.discountPercent,
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 font-semibold text-gray-700">
                              <Users
                                size={17}
                                className="text-[#C89B3C]"
                                aria-hidden="true"
                              />

                              {formatNumber(
                                coupon.maxUses,
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <p className="whitespace-nowrap text-sm font-semibold text-gray-700">
                              {formatIstDateTime(
                                coupon.startsAt,
                              )}
                            </p>

                            <p className="mt-1 whitespace-nowrap text-sm text-gray-500">
                              to{" "}
                              {formatIstDateTime(
                                coupon.endsAt,
                              )}
                            </p>
                          </td>

                          <td className="px-6 py-5">
                            <span className="inline-flex rounded-full bg-[#FFF4DE] px-3 py-1 text-xs font-bold text-[#A66A00]">
                              {coupon.oneUsePerPhone
                                ? "Once per mobile"
                                : "Repeat allowed"}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(
                                status,
                              )}`}
                            >
                              {status}
                            </span>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={
                                  isDeleting ||
                                  isChangingStatus
                                }
                                onClick={() =>
                                  openEditModal(
                                    coupon,
                                  )
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E7C98C] bg-white px-4 text-sm font-semibold text-[#6D2E00] transition hover:bg-[#FFF8EE] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Edit3
                                  size={16}
                                  aria-hidden="true"
                                />
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  isChangingStatus ||
                                  isDeleting
                                }
                                onClick={() =>
                                  void toggleCouponStatus(
                                    coupon,
                                  )
                                }
                                className="h-10 rounded-xl bg-[#6D2E00] px-4 text-sm font-semibold text-white transition hover:bg-[#8B3A00] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isChangingStatus
                                  ? "Saving..."
                                  : coupon.isActive
                                    ? "Disable"
                                    : "Enable"}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  isDeleting ||
                                  isChangingStatus
                                }
                                onClick={() =>
                                  void deleteCoupon(
                                    coupon,
                                  )
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <Trash2
                                  size={16}
                                  aria-hidden="true"
                                />

                                {isDeleting
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-[#F3DFC2] bg-[#FFFDF8] px-6 py-5 text-sm leading-6 text-gray-600 sm:px-8">
            Coupons can be edited,
            enabled, disabled or deleted.
            Delete only coupons that you no
            longer need. Real
            used/remaining counts will be
            added when redemption tracking
            is introduced.
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coupon-modal-title"
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#F3DFC2] bg-white px-6 py-5 sm:px-8">
              <div>
                <h2
                  id="coupon-modal-title"
                  className="text-2xl font-bold text-[#6D2E00]"
                >
                  {editingId
                    ? "Edit Coupon"
                    : "Add Coupon"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Enter the offer schedule
                  in IST. Coupon codes keep
                  their exact letter casing.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
              >
                <X
                  size={20}
                  aria-hidden="true"
                />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-6 p-6 sm:p-8"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                  Coupon Code
                </label>

                <input
                  type="text"
                  value={
                    form.code
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "code",
                      event.target
                        .value,
                    )
                  }
                  placeholder="omshree99"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={saving}
                  required
                  className={
                    inputClassName
                  }
                />

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  Case-sensitive.
                  Example:{" "}
                  <span className="font-mono font-semibold">
                    omshree99
                  </span>{" "}
                  is different from{" "}
                  <span className="font-mono font-semibold">
                    OMSHREE99
                  </span>
                  .
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                    Discount Percentage
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={
                      form.discountPercent
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "discountPercent",
                        event.target
                          .value,
                      )
                    }
                    placeholder="10"
                    disabled={saving}
                    required
                    className={
                      inputClassName
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                    Maximum Customers
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    step="1"
                    value={
                      form.maxUses
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "maxUses",
                        event.target
                          .value,
                      )
                    }
                    placeholder="99"
                    disabled={saving}
                    required
                    className={
                      inputClassName
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#F0D5A2] bg-[#FFFDF8] p-5">
                <h3 className="font-bold text-[#6D2E00]">
                  Validity Period
                </h3>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Enter both values in
                  India Standard Time
                  (IST).
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                      Starts At
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.startsAt
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "startsAt",
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        saving
                      }
                      required
                      className={
                        inputClassName
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                      Ends At
                    </label>

                    <input
                      type="datetime-local"
                      value={
                        form.endsAt
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "endsAt",
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        saving
                      }
                      required
                      className={
                        inputClassName
                      }
                    />
                  </div>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] p-4">
                <input
                  type="checkbox"
                  checked={
                    form.oneUsePerPhone
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "oneUsePerPhone",
                      event.target
                        .checked,
                    )
                  }
                  disabled={saving}
                  className="mt-1 h-4 w-4 accent-[#6D2E00]"
                />

                <span>
                  <span className="block font-semibold text-[#6D2E00]">
                    One use per mobile
                    number
                  </span>

                  <span className="mt-1 block text-sm leading-6 text-gray-500">
                    When enabled, one
                    normalized mobile
                    number may successfully
                    use this particular
                    coupon only once.
                    Different future
                    coupons remain
                    available to the same
                    customer.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] p-4">
                <input
                  type="checkbox"
                  checked={
                    form.isActive
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "isActive",
                      event.target
                        .checked,
                    )
                  }
                  disabled={saving}
                  className="mt-1 h-4 w-4 accent-[#6D2E00]"
                />

                <span>
                  <span className="block font-semibold text-[#6D2E00]">
                    Enabled
                  </span>

                  <span className="mt-1 block text-sm leading-6 text-gray-500">
                    The coupon must be
                    enabled and inside its
                    validity period before
                    customers can use it.
                  </span>
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-[#F3DFC2] pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="h-12 rounded-2xl border border-[#E7C98C] bg-white px-6 font-semibold text-[#6D2E00] transition hover:bg-[#FFF8EE] disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="h-12 rounded-2xl bg-[#6D2E00] px-6 font-semibold text-white transition hover:bg-[#8B3A00] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}