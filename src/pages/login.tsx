import { z } from "zod";
import Nav from "@/components/Nav";
import { FormEvent, useState, useRef } from "react";
import { ILoginError } from "./api/user/login";
import { useRouter } from "next/router";
import { withIronSessionSsr } from "iron-session/next";
import { sessionOptions } from "@/lib/session";

export default function Login() {
  const router = useRouter();
  const [emailClientError, setEmailClientError] = useState("");
  const [serverError, setServerError] = useState<ILoginError>({
    email: false,
    password: false,
    attempts: false,
    timeTillReset: 0,
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const errorMsgStyle = `h-7 text-xs ${formSubmitted ? "text-red-500" : ""}
  `;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormSubmitted(true);
    if (!emailClientError) {
      const user = {
        email: emailRef.current?.value,
        password: passwordRef.current?.value,
      };
      const resp = await fetch(`/api/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      if (!resp.ok) {
        const { error } = await resp.json();
        console.log(error);
        if (resp.status === 500) {
          return console.error(error);
        }
        return setServerError(error);
      }

      router.push("/profile");
    }
  }

  function checkEmail() {
    const emailSchema = z.string().email();
    try {
      emailSchema.parse(emailRef.current?.value);
      setEmailClientError("");
    } catch (error) {
      if (error instanceof z.ZodError) {
        setEmailClientError(error.format()._errors[0]);
      }
    }
  }

  return (
    <>
      <Nav />
      <main className="h-screen flex justify-center items-center ">
        <form
          onSubmit={handleSubmit}
          className="p-7 bg-slate-700 space-y-5 rounded-md"
        >
          <label className="block">
            <span className="block">Email</span>
            <input
              type="email"
              ref={emailRef}
              className="rounded-sm text-black"
              onChange={() => {
                checkEmail();
                setServerError({ ...serverError, email: false });
              }}
            />
            <ul className={errorMsgStyle}>
              {emailClientError}
              {serverError.email && <li>That email does not exist</li>}
            </ul>
          </label>
          <label className="block">
            <span className="block">Password</span>
            <input
              type="password"
              ref={passwordRef}
              className="rounded-sm text-black"
              onChange={() => {
                setServerError({
                  ...serverError,
                  password: false,
                  attempts: false,
                });
              }}
            />
            <ul className={errorMsgStyle}>
              {serverError.password && <li>Incorrect password</li>}
              {serverError.attempts && <li>Too many attempts, please wait.</li>}
            </ul>
          </label>
          <button className="block mx-auto border py-1 px-2 rounded-sm uppercase hover:bg-neutral-200 hover:text-black">
            sign in
          </button>
        </form>
      </main>
    </>
  );
}

export const getServerSideProps = withIronSessionSsr(({ req, res }) => {
  const { user } = req.session;

  if (user) {
    res.setHeader("location", "/");
    res.statusCode = 307;
    res.end();
  }

  return {
    props: {},
  };
}, sessionOptions);