import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <>
      {/* Hero */}

      <section className="relative overflow-hidden bg-gradient-to-br from-[#6D2E00] via-[#8B4513] to-[#C89B3C] py-24 text-white">
        <div className="absolute inset-0 bg-black/10" />

        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FFE4A3]/20 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur-md">
            Create Your Account
          </div>

          <h1 className="mt-8 text-5xl font-bold md:text-6xl">
            Join
            <br />
            Om Shree Foods
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-9 text-white/90">
            Create your account to order homemade foods, track your orders,
            save delivery details, and enjoy a faster checkout experience.
          </p>
        </div>
      </section>

      {/* Form */}

      <main className="relative -mt-10 min-h-screen bg-[#FFFDF8] pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <RegisterForm />
        </div>
      </main>
    </>
  );
}