"use client";

import Link from "next/link";
import React from "react";
import Image from "next/image";
import Navitems from "./Navitems";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

const Navbar = () => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  return (
    <nav className="navbar">
      <Link href="/">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <Image src="/images/logo.svg" alt="logo" width={46} height={44} />
        </div>
      </Link>

      <div className="flex items-center gap-8">
        <Navitems />

        {!isSignedIn ? (
          <SignUpButton >
            <button className="btn-signin">Sign In</button>
          </SignUpButton>
        ) : (
          <UserButton  />
        )}
      </div>
    </nav>
  );
};

export default Navbar;
