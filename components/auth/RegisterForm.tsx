"use client";

import type {
  ChangeEvent,
  FormEvent,
} from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const initialFormData: RegisterFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const fields = [
  {
    name: "name",
    type: "text",
    label: "Full Name",
    placeholder: "Enter your full name",
    icon: User,
    required: true,
    autoComplete: "name",
  },
  {
    name: "email",
    type: "email",
    label: "Email Address",
    placeholder: "Enter your email address",
    icon: Mail,
    required: true,
    autoComplete: "email",
  },
  {
    name: "phone",
    type: "tel",
    label: "Phone Number",
    placeholder: "Enter your phone number",
    icon: Phone,
    required: false,
    autoComplete: "tel",
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    placeholder: "Create a password",
    icon: Lock,
    required: true,
    autoComplete: "new-password",
  },
  {
    name: "confirmPassword",
    type: "password",
    label: "Confirm Password",
    placeholder: "Re-enter your password",
    icon: Lock,
    required: true,
    autoComplete: "new-password",
  },
] as const;

const benefits = [
  "Fast and secure checkout",
  "Track your orders",
  "Save delivery information",
  "Access homemade specialties",
];

export default function RegisterForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] =
    useState<RegisterFormData>(initialFormData);

  function handleChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        }),
      });

      const data: {
        error?: string;
      } = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Registration failed.");
        return;
      }

      toast.success("Registration successful.");

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Registration error:", error);

      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-10">
      <Card
        padding="none"
        className="relative hidden overflow-hidden border-[#8B5A1E] bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] text-white shadow-2xl lg:block"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FFE4A3]/20 blur-3xl"
        />

        <div className="relative p-10 xl:p-12">
          <Badge
            variant="neutral"
            className="gap-2 border border-white/20 bg-white/10 text-white backdrop-blur-md"
          >
            <Sparkles
              size={16}
              aria-hidden="true"
            />

            Welcome
          </Badge>

          <h2 className="mt-8 text-5xl font-bold leading-tight">
            Homemade
            <span className="block text-[#FFE4A3]">
              Goodness Delivered
            </span>
          </h2>

          <p className="mt-7 text-lg leading-9 text-white/85">
            Join Om Shree Foods for faster ordering, saved details, order
            tracking and easy access to our homemade products.
          </p>

          <div className="mt-10 space-y-4">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck
                    size={21}
                    className="text-[#FFE4A3]"
                    aria-hidden="true"
                  />
                </div>

                <span className="font-medium text-white/90">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card
        padding="lg"
        className="bg-white shadow-2xl"
      >
        <div className="mb-8">
          <Badge variant="neutral">
            New Customer
          </Badge>

          <h1 className="mt-5 text-3xl font-bold text-[#6D2E00]">
            Create Your Account
          </h1>

          <p className="mt-2 leading-7 text-gray-600">
            Enter your details to start ordering.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {fields.map((field) => {
            const Icon = field.icon;

            return (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                >
                  {field.label}
                  {!field.required && (
                    <span className="ml-2 font-normal text-gray-400">
                      Optional
                    </span>
                  )}
                </label>

                <div className="relative">
                  <Icon
                    size={20}
                    className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#C89B3C]"
                    aria-hidden="true"
                  />

                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                    autoComplete={field.autoComplete}
                    disabled={loading}
                    className="h-14 w-full rounded-2xl border border-[#F3DFC2] bg-[#FFFDF8] pl-14 pr-4 text-[#6D2E00] outline-none transition-all duration-300 placeholder:text-gray-400 focus:border-[#C89B3C] focus:bg-white focus:ring-4 focus:ring-[#C89B3C]/15 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>
            );
          })}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            rightIcon={
              <ArrowRight
                size={18}
                aria-hidden="true"
              />
            }
            className="mt-2"
          >
            Create Account
          </Button>
        </form>

        <div className="mt-8 border-t border-[#F3DFC2] pt-6 text-center text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="rounded-md font-semibold text-[#6D2E00] transition-colors hover:text-[#C89B3C] focus:outline-none focus:ring-4 focus:ring-[#C89B3C]/20"
          >
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}