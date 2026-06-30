import { appUsers } from "@/lib/auth";

type SignInPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const roleDescriptions = {
  admin: "Access to everything.",
  sales: "Sales and inventory only.",
  setup: "Inventory, create setup, and schedule only.",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const query = searchParams ? await searchParams : {};

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-8 text-zinc-50">
      <section className="w-full max-w-4xl">
        <h1 className="text-center text-4xl font-bold">SDM Steel Sign In</h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-zinc-400">
          Choose the account that matches the work area you need.
        </p>

        {query.error ? (
          <p className="mx-auto mt-6 max-w-md rounded-md border border-red-900 bg-red-950 px-4 py-3 text-center text-sm font-semibold text-red-200">
            The username or password was not correct.
          </p>
        ) : null}

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {appUsers.map((user) => (
            <form
              key={user.username}
              action="/api/sign-in"
              method="post"
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
            >
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="mt-2 min-h-10 text-sm text-zinc-400">
                {roleDescriptions[user.role]}
              </p>

              <input name="username" type="hidden" value={user.username} />
              <input name="password" type="hidden" value={user.password} />

              <dl className="mt-5 grid gap-2 text-sm">
                <div>
                  <dt className="text-zinc-500">Username</dt>
                  <dd className="font-semibold">{user.username}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Password</dt>
                  <dd className="font-semibold">{user.password}</dd>
                </div>
              </dl>

              <button
                className="mt-5 w-full rounded-md bg-cyan-300 px-4 py-3 font-bold text-zinc-950 hover:bg-cyan-200"
                type="submit"
              >
                Sign In
              </button>
            </form>
          ))}
        </div>
      </section>
    </main>
  );
}
