"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Edit3,
  PackageCheck,
  Plus,
  RefreshCw,
  Ruler,
  Scale,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ShippingPackage {
  id: string;
  name: string;
  code: string;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  emptyWeightGrams: number;
  maxWeightGrams: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  warnings?: string[];
}

interface PackageFormData {
  name: string;
  code: string;
  lengthCm: string;
  breadthCm: string;
  heightCm: string;
  emptyWeightGrams: string;
  maxWeightGrams: string;
  active: boolean;
}

interface ApiError {
  error?: string;
  message?: string;
}

const emptyForm: PackageFormData = {
  name: "",
  code: "",
  lengthCm: "",
  breadthCm: "",
  heightCm: "",
  emptyWeightGrams: "",
  maxWeightGrams: "",
  active: true,
};

const inputClassName =
  "h-12 w-full rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] px-4 text-[#6D2E00] outline-none transition focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60";

function normalizeCode(
  value: string,
) {
  return value
    .toUpperCase()
    .replace(
      /[^A-Z0-9]+/g,
      "_",
    )
    .replace(
      /^_+|_+$/g,
      "",
    );
}

function formatNumber(
  value: number,
) {
  return value.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    },
  );
}


function getPackageVolumeCm3(
  shippingPackage:
    Pick<
      ShippingPackage,
      | "lengthCm"
      | "breadthCm"
      | "heightCm"
    >,
) {
  return (
    shippingPackage.lengthCm *
    shippingPackage.breadthCm *
    shippingPackage.heightCm
  );
}

function getPackageWarnings(
  shippingPackage:
    ShippingPackage,
  allPackages:
    ShippingPackage[],
) {
  if (!shippingPackage.active) {
    return [];
  }

  const packageVolume =
    getPackageVolumeCm3(
      shippingPackage,
    );

  const warnings: string[] =
    [];

  for (const other of allPackages) {
    if (
      !other.active ||
      other.id ===
        shippingPackage.id
    ) {
      continue;
    }

    const otherVolume =
      getPackageVolumeCm3(
        other,
      );

    if (
      Math.abs(
        packageVolume -
          otherVolume,
      ) < 0.001 &&
      shippingPackage.maxWeightGrams ===
        other.maxWeightGrams
    ) {
      warnings.push(
        `Same volume and max weight as ${other.name}.`,
      );

      continue;
    }

    if (
      packageVolume <
        otherVolume &&
      shippingPackage.maxWeightGrams >
        other.maxWeightGrams
    ) {
      warnings.push(
        `Smaller than ${other.name}, but rated for more packed weight.`,
      );
    }

    if (
      packageVolume >
        otherVolume &&
      shippingPackage.maxWeightGrams <
        other.maxWeightGrams
    ) {
      warnings.push(
        `Larger than ${other.name}, but rated for less packed weight.`,
      );
    }

    if (
      packageVolume >=
        otherVolume &&
      shippingPackage.emptyWeightGrams <
        other.emptyWeightGrams
    ) {
      warnings.push(
        `At least as large as ${other.name}, but has a lower empty weight.`,
      );
    }
  }

  return Array.from(
    new Set(warnings),
  ).slice(0, 3);
}

function isShippingPackage(
  value: unknown,
): value is ShippingPackage {
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
    typeof item.name === "string" &&
    typeof item.code === "string" &&
    typeof item.lengthCm ===
      "number" &&
    typeof item.breadthCm ===
      "number" &&
    typeof item.heightCm ===
      "number" &&
    typeof item.emptyWeightGrams ===
      "number" &&
    typeof item.maxWeightGrams ===
      "number" &&
    typeof item.active ===
      "boolean"
  );
}

function validateForm(
  form: PackageFormData,
) {
  if (
    form.name.trim().length < 2
  ) {
    return "Enter a package name.";
  }

  if (
    normalizeCode(
      form.code,
    ).length < 2
  ) {
    return "Enter a valid package code.";
  }

  const dimensions = [
    Number(form.lengthCm),
    Number(form.breadthCm),
    Number(form.heightCm),
  ];

  if (
    dimensions.some(
      (dimension) =>
        !Number.isFinite(
          dimension,
        ) ||
        dimension <= 0 ||
        dimension > 1000,
    )
  ) {
    return "Length, breadth and height must each be greater than 0 and no more than 1000 cm.";
  }

  const emptyWeight =
    Number(
      form.emptyWeightGrams,
    );

  const maxWeight =
    Number(
      form.maxWeightGrams,
    );

  if (
    !Number.isInteger(
      emptyWeight,
    ) ||
    emptyWeight < 0 ||
    emptyWeight > 100_000
  ) {
    return "Empty package weight must be a whole number between 0 and 100000 grams.";
  }

  if (
    !Number.isInteger(
      maxWeight,
    ) ||
    maxWeight < 1 ||
    maxWeight > 100_000
  ) {
    return "Maximum packed weight must be a whole number between 1 and 100000 grams.";
  }

  if (
    emptyWeight >= maxWeight
  ) {
    return "Maximum packed weight must be greater than the empty package weight.";
  }

  return null;
}

function formFromPackage(
  shippingPackage: ShippingPackage,
): PackageFormData {
  return {
    name:
      shippingPackage.name,
    code:
      shippingPackage.code,
    lengthCm:
      String(
        shippingPackage.lengthCm,
      ),
    breadthCm:
      String(
        shippingPackage.breadthCm,
      ),
    heightCm:
      String(
        shippingPackage.heightCm,
      ),
    emptyWeightGrams:
      String(
        shippingPackage
          .emptyWeightGrams,
      ),
    maxWeightGrams:
      String(
        shippingPackage
          .maxWeightGrams,
      ),
    active:
      shippingPackage.active,
  };
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
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

export default function AdminShippingPackagesPage() {
  const [
    packages,
    setPackages,
  ] = useState<
    ShippingPackage[]
  >([]);

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
    form,
    setForm,
  ] = useState<
    PackageFormData
  >(emptyForm);

  const loadPackages =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/admin/shipping-packages",
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
              "Unable to load shipping packages.",
          );
        }

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid shipping package response.",
          );
        }

        setPackages(
          data.filter(
            isShippingPackage,
          ),
        );
      } catch (error) {
        console.error(
          "Shipping package loading error:",
          error,
        );

        setPackages([]);

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load shipping packages.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  const stats =
    useMemo(() => {
      const active =
        packages.filter(
          (shippingPackage) =>
            shippingPackage.active,
        );

      const warningCount =
        packages.reduce(
          (
            total,
            shippingPackage,
          ) =>
            total +
            (getPackageWarnings(
              shippingPackage,
              packages,
            ).length > 0
              ? 1
              : 0),
          0,
        );

      return {
        total:
          packages.length,

        active:
          active.length,

        warningCount,

        smallest:
          active[0]
            ? `${formatNumber(
                active[0]
                  .maxWeightGrams,
              )} g`
            : "—",

        largest:
          active.length > 0
            ? `${formatNumber(
                Math.max(
                  ...active.map(
                    (item) =>
                      item.maxWeightGrams,
                  ),
                ),
              )} g`
            : "—",
      };
    }, [packages]);

  function openCreateModal() {
    setEditingId(null);

    setForm(
      emptyForm,
    );

    setModalOpen(true);
  }

  function openEditModal(
    shippingPackage:
      ShippingPackage,
  ) {
    setEditingId(
      shippingPackage.id,
    );

    setForm(
      formFromPackage(
        shippingPackage,
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
    setForm(emptyForm);
  }

  function updateField<
    K extends keyof PackageFormData,
  >(
    field: K,
    value: PackageFormData[K],
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
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

    setSaving(true);

    try {
      const payload = {
        name:
          form.name.trim(),

        code:
          normalizeCode(
            form.code,
          ),

        lengthCm:
          Number(
            form.lengthCm,
          ),

        breadthCm:
          Number(
            form.breadthCm,
          ),

        heightCm:
          Number(
            form.heightCm,
          ),

        emptyWeightGrams:
          Number(
            form.emptyWeightGrams,
          ),

        maxWeightGrams:
          Number(
            form.maxWeightGrams,
          ),

        active:
          form.active,
      };

      const url =
        editingId
          ? `/api/admin/shipping-packages/${editingId}`
          : "/api/admin/shipping-packages";

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
            "Unable to save shipping package.",
        );
      }

      toast.success(
        editingId
          ? "Shipping package updated."
          : "Shipping package created.",
      );

      const responseWarnings =
        data &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        Array.isArray(
          (data as ShippingPackage)
            .warnings,
        )
          ? (
              (data as ShippingPackage)
                .warnings ?? []
            ).filter(
              (warning):
                warning is string =>
                  typeof warning ===
                  "string",
            )
          : [];

      if (
        responseWarnings.length > 0
      ) {
        toast.warning(
          responseWarnings[0],
        );
      }

      closeModal();

      await loadPackages();
    } catch (error) {
      console.error(
        "Shipping package save error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save shipping package.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FFF9F0] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-[#F0D5A2] bg-white/95 p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#C89B3C]">
                Shipping Management
              </p>

              <h1 className="mt-3 text-3xl font-bold text-[#6D2E00] sm:text-4xl">
                Shipping Packages
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-gray-600">
                Manage the real outer
                boxes and packets used
                for Delhivery quotes.
                Checkout chooses the
                smallest active package
                that satisfies packed
                weight and dimension
                requirements.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  void loadPackages()
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
                Add Package
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Total Packages"
            value={stats.total}
            icon={
              <Box
                size={24}
                aria-hidden="true"
              />
            }
          />

          <StatCard
            title="Active Packages"
            value={stats.active}
            icon={
              <PackageCheck
                size={24}
                aria-hidden="true"
              />
            }
          />

          <StatCard
            title="Smallest Capacity"
            value={stats.smallest}
            icon={
              <Scale
                size={24}
                aria-hidden="true"
              />
            }
          />

          <StatCard
            title="Largest Capacity"
            value={stats.largest}
            icon={
              <Scale
                size={24}
                aria-hidden="true"
              />
            }
          />

          <StatCard
            title="Review Needed"
            value={stats.warningCount}
            icon={
              <AlertTriangle
                size={24}
                aria-hidden="true"
              />
            }
          />
        </div>

        {stats.warningCount > 0 && (
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle
                  size={23}
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2 className="text-lg font-bold text-amber-900">
                  Package Configuration Review
                </h2>

                <p className="mt-1 leading-6 text-amber-800">
                  {stats.warningCount} active package
                  {stats.warningCount === 1 ? "" : "s"} have unusual
                  size, empty-weight or maximum-weight relationships.
                  These are warnings only because real packaging can
                  legitimately use different materials and strength ratings.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#F0D5A2] bg-white shadow-xl">
          <div className="border-b border-[#F3DFC2] px-6 py-5 sm:px-8">
            <h2 className="text-xl font-bold text-[#6D2E00]">
              Package Presets
            </h2>

            <p className="mt-1 text-sm leading-6 text-gray-500">
              The dimensions below are
              the outer carton dimensions
              passed to Delhivery.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-500">
              Loading shipping
              packages...
            </div>
          ) : packages.length ===
            0 ? (
            <div className="p-10 text-center">
              <Box
                size={48}
                className="mx-auto text-[#C89B3C]"
                aria-hidden="true"
              />

              <h3 className="mt-4 text-xl font-bold text-[#6D2E00]">
                No Shipping Packages
              </h3>

              <p className="mt-2 text-gray-500">
                Create at least one
                active package before
                using checkout.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead className="bg-[#FFF8EE]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Package
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Dimensions
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Empty Weight
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Max Packed Weight
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {packages.map(
                    (
                      shippingPackage,
                    ) => {
                      const packageWarnings =
                        getPackageWarnings(
                          shippingPackage,
                          packages,
                        );

                      return (
                      <tr
                        key={
                          shippingPackage.id
                        }
                        className="border-t border-[#F3DFC2]"
                      >
                        <td className="px-6 py-5">
                          <p className="font-bold text-[#6D2E00]">
                            {
                              shippingPackage.name
                            }
                          </p>

                          <p className="mt-1 font-mono text-xs text-gray-500">
                            {
                              shippingPackage.code
                            }
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 font-semibold text-gray-700">
                            <Ruler
                              size={17}
                              className="text-[#C89B3C]"
                              aria-hidden="true"
                            />

                            {formatNumber(
                              shippingPackage.lengthCm,
                            )}{" "}
                            ×{" "}
                            {formatNumber(
                              shippingPackage.breadthCm,
                            )}{" "}
                            ×{" "}
                            {formatNumber(
                              shippingPackage.heightCm,
                            )}{" "}
                            cm
                          </div>
                        </td>

                        <td className="px-6 py-5 font-semibold text-gray-700">
                          {formatNumber(
                            shippingPackage.emptyWeightGrams,
                          )}{" "}
                          g
                        </td>

                        <td className="px-6 py-5 font-semibold text-gray-700">
                          {formatNumber(
                            shippingPackage.maxWeightGrams,
                          )}{" "}
                          g
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                              shippingPackage.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {shippingPackage.active ? (
                              <CheckCircle2
                                size={14}
                                aria-hidden="true"
                              />
                            ) : (
                              <XCircle
                                size={14}
                                aria-hidden="true"
                              />
                            )}

                            {shippingPackage.active
                              ? "Active"
                              : "Inactive"}
                          </span>

                          {packageWarnings.length > 0 && (
                            <div className="mt-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                <AlertTriangle
                                  size={13}
                                  aria-hidden="true"
                                />
                                Review
                              </span>

                              <p
                                className="mt-2 max-w-[240px] text-xs leading-5 text-amber-800"
                                title={packageWarnings.join(" ")}
                              >
                                {packageWarnings[0]}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                shippingPackage,
                              )
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E7C98C] bg-white px-4 text-sm font-semibold text-[#6D2E00] transition hover:bg-[#FFF8EE]"
                          >
                            <Edit3
                              size={16}
                              aria-hidden="true"
                            />
                            Edit
                          </button>
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
            Deactivate a package instead
            of deleting it. Historical
            orders keep their selected
            package reference and
            dimension snapshots.
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shipping-package-modal-title"
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#F3DFC2] bg-white px-6 py-5 sm:px-8">
              <div>
                <h2
                  id="shipping-package-modal-title"
                  className="text-2xl font-bold text-[#6D2E00]"
                >
                  {editingId
                    ? "Edit Shipping Package"
                    : "Add Shipping Package"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Use the actual outer
                  dimensions and empty
                  packing weight of the
                  carton or courier
                  packet. Unusual
                  size/weight relationships
                  will be flagged for review
                  after saving.
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
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                    Package Name
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "name",
                        event.target
                          .value,
                      )
                    }
                    placeholder="Small Box"
                    disabled={saving}
                    required
                    className={
                      inputClassName
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                    Package Code
                  </label>

                  <input
                    type="text"
                    value={form.code}
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "code",
                        normalizeCode(
                          event.target
                            .value,
                        ),
                      )
                    }
                    placeholder="SMALL_BOX"
                    disabled={saving}
                    required
                    className={
                      inputClassName
                    }
                  />
                </div>
              </div>

              <div>
                <h3 className="font-bold text-[#6D2E00]">
                  Outer Dimensions
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Measure the outside of
                  the packed shipping
                  box.
                </p>

                <div className="mt-4 grid gap-5 sm:grid-cols-3">
                  {[
                    [
                      "Length",
                      "lengthCm",
                    ],
                    [
                      "Breadth",
                      "breadthCm",
                    ],
                    [
                      "Height",
                      "heightCm",
                    ],
                  ].map(
                    ([
                      label,
                      key,
                    ]) => (
                      <div
                        key={key}
                      >
                        <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                          {label} (cm)
                        </label>

                        <input
                          type="number"
                          min="0.01"
                          max="1000"
                          step="0.01"
                          value={
                            form[
                              key as
                                | "lengthCm"
                                | "breadthCm"
                                | "heightCm"
                            ]
                          }
                          onChange={(
                            event,
                          ) =>
                            updateField(
                              key as
                                | "lengthCm"
                                | "breadthCm"
                                | "heightCm",
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
                    ),
                  )}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                    Empty Package Weight
                    (g)
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    value={
                      form.emptyWeightGrams
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "emptyWeightGrams",
                        event.target
                          .value,
                      )
                    }
                    disabled={saving}
                    required
                    className={
                      inputClassName
                    }
                  />

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Include the box,
                    tape and normal
                    protective packing.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#6D2E00]">
                    Maximum Packed Weight
                    (g)
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="100000"
                    step="1"
                    value={
                      form.maxWeightGrams
                    }
                    onChange={(
                      event,
                    ) =>
                      updateField(
                        "maxWeightGrams",
                        event.target
                          .value,
                      )
                    }
                    disabled={saving}
                    required
                    className={
                      inputClassName
                    }
                  />

                  <p className="mt-2 text-xs leading-5 text-gray-500">
                    Maximum total weight
                    after products and
                    packing are inside.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E7C98C] bg-[#FFFDF8] p-4">
                <input
                  type="checkbox"
                  checked={
                    form.active
                  }
                  onChange={(
                    event,
                  ) =>
                    updateField(
                      "active",
                      event.target
                        .checked,
                    )
                  }
                  disabled={saving}
                  className="mt-1 h-4 w-4 accent-[#6D2E00]"
                />

                <span>
                  <span className="block font-semibold text-[#6D2E00]">
                    Active package
                  </span>

                  <span className="mt-1 block text-sm leading-6 text-gray-500">
                    Active packages can
                    be selected during
                    checkout. Keep at
                    least one package
                    active.
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
                      : "Create Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}