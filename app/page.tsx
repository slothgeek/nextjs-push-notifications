import Image from "next/image";
import PushNotificationManager from "./push";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col gap-8 py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className=" text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Notificaciones Push by Jorge Castrillo
          </h1>
          <PushNotificationManager />
        </div>
      </main>
    </div>
  );
}
