"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";
import {
  Mail,
  MessageSquare,
  Phone,
  Send,
  User,
} from "lucide-react";
import { toast } from "sonner";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const initialFormState: ContactFormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const inputClassName = `
  w-full
  rounded-2xl
  border
  border-[#F3DFC2]
  bg-[#FFFDF8]
  px-4
  py-4
  text-[#6D2E00]
  outline-none
  transition-all
  duration-200
  placeholder:text-gray-400
  hover:border-[#C89B3C]/60
  focus:border-[#C89B3C]
  focus:ring-4
  focus:ring-[#FFF4DE]
  disabled:cursor-not-allowed
  disabled:opacity-60
`;

const contactBenefits = [
  {
    title: "Fast Email Support",
    description:
      "We usually respond within one business day.",
    icon: Mail,
  },
  {
    title: "Friendly Assistance",
    description:
      "Our team is ready to help with every question.",
    icon: Phone,
  },
  {
    title: "Catering & Orders",
    description:
      "Reach out for custom orders and event catering.",
    icon: MessageSquare,
  },
];

export default function ContactForm() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] =
    useState<ContactFormState>(initialFormState);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to send your message."
        );
      }

      toast.success("Message sent successfully!");

      setForm(initialFormState);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden bg-[#FFFDF8] py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#FFF4DE]/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#FFE8BF]/60 blur-3xl"
      />

      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          {/* Contact introduction */}

          <div className="flex flex-col justify-center">
            <SectionHeader
              badge="Send a Message"
              title="We'd Love to Hear Your Thoughts"
              description="Whether you have a product inquiry, catering request, feedback or simply want to say hello, our team is always happy to help."
              align="left"
            />

            <div className="mt-10 space-y-5">
              {contactBenefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <Card
                    key={benefit.title}
                    variant="filled"
                    padding="sm"
                    className="shadow-none"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF4DE]">
                        <Icon
                          size={22}
                          className="text-[#C89B3C]"
                          aria-hidden="true"
                        />
                      </div>

                      <div>
                        <h3 className="font-semibold text-[#6D2E00]">
                          {benefit.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Contact form */}

          <Card
            padding="lg"
            className="shadow-2xl"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#6D2E00] sm:text-3xl">
                Send Us a Message
              </h2>

              <p className="mt-2 leading-7 text-gray-500">
                Fill in the details below and our team
                will get back to you as soon as possible.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                  >
                    Your Name
                    <span
                      className="ml-1 text-red-500"
                      aria-hidden="true"
                    >
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <User
                      size={18}
                      className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#C89B3C]"
                      aria-hidden="true"
                    />

                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      placeholder="Enter your name"
                      disabled={loading}
                      className={`${inputClassName} pl-12`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                  >
                    Email Address
                    <span
                      className="ml-1 text-red-500"
                      aria-hidden="true"
                    >
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <Mail
                      size={18}
                      className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#C89B3C]"
                      aria-hidden="true"
                    />

                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      placeholder="Enter your email"
                      disabled={loading}
                      className={`${inputClassName} pl-12`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-phone"
                  className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                >
                  Phone Number
                  <span className="ml-2 font-normal text-gray-400">
                    Optional
                  </span>
                </label>

                <div className="relative">
                  <Phone
                    size={18}
                    className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#C89B3C]"
                    aria-hidden="true"
                  />

                  <input
                    id="contact-phone"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Enter your phone number"
                    disabled={loading}
                    className={`${inputClassName} pl-12`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                >
                  Subject
                  <span className="ml-2 font-normal text-gray-400">
                    Optional
                  </span>
                </label>

                <input
                  id="contact-subject"
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  disabled={loading}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-sm font-semibold text-[#6D2E00]"
                >
                  Message
                  <span
                    className="ml-1 text-red-500"
                    aria-hidden="true"
                  >
                    *
                  </span>
                </label>

                <textarea
                  id="contact-message"
                  rows={6}
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell us how we can help..."
                  disabled={loading}
                  className={`${inputClassName} resize-y`}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={loading}
                leftIcon={
                  <Send
                    size={18}
                    aria-hidden="true"
                  />
                }
              >
                {loading
                  ? "Sending..."
                  : "Send Message"}
              </Button>
            </form>
          </Card>
        </div>
      </Container>
    </section>
  );
}