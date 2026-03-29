import React from "react";
import Image from "next/image";
import Link from "next/link";
const page = () => {
  return (
    <article className="companion-limit">
      <Image
        src="/images/limit.svg"
        alt="limit reached"
        width={360}
        height={230}
      />
      <div className="cta-badge">Upgrade your Plan</div>
      <h1>You've Reached Your Limit</h1>
      <p>You've reached your limits. Upgrade to unlock premium features.</p>
      <Link href={"/subscription"}>
        <button className="btn-primary w-full justify-center">
          Upgrade My Plan
        </button>
      </Link>
    </article>
  );
};

export default page;
