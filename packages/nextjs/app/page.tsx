"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { CogIcon, CurrencyDollarIcon, ShieldCheckIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold text-primary">TrustEscrow</span>
          </h1>
          <p className="text-center text-lg mt-4 text-base-content/80">
            A secure, decentralized escrow platform built on TRUST
          </p>

          <div className="flex justify-center items-center space-x-2 flex-col mt-6">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>

          <div className="text-center mt-6">
            <Link href="/escrow" className="btn btn-primary btn-lg px-8">
              Launch Escrow App
            </Link>
          </div>
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-8 flex-col md:flex-row">
            <div className="flex flex-col bg-base-100 px-8 py-8 text-center items-center max-w-xs rounded-3xl shadow-lg">
              <ShieldCheckIcon className="h-12 w-12 fill-primary text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Secure Escrows</h3>
              <p className="text-base-content/70">Create secure escrow agreements with smart contract protection</p>
            </div>

            <div className="flex flex-col bg-base-100 px-8 py-8 text-center items-center max-w-xs rounded-3xl shadow-lg">
              <CurrencyDollarIcon className="h-12 w-12 fill-secondary text-secondary mb-4" />
              <h3 className="text-xl font-bold mb-2">Trustless Transactions</h3>
              <p className="text-base-content/70">Automated fund release and refund mechanisms</p>
            </div>

            <div className="flex flex-col bg-base-100 px-8 py-8 text-center items-center max-w-xs rounded-3xl shadow-lg">
              <UserGroupIcon className="h-12 w-12 fill-accent text-accent mb-4" />
              <h3 className="text-xl font-bold mb-2">Arbitration System</h3>
              <p className="text-base-content/70">Fair dispute resolution through trusted arbiters</p>
            </div>

            <div className="flex flex-col bg-base-100 px-8 py-8 text-center items-center max-w-xs rounded-3xl shadow-lg">
              <CogIcon className="h-12 w-12 fill-neutral text-neutral mb-4" />
              <h3 className="text-xl font-bold mb-2">Factory Deployed</h3>
              <p className="text-base-content/70">Create multiple escrows efficiently</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="bg-base-100 p-6 rounded-3xl inline-block">
              <h3 className="text-xl font-bold mb-4">Ready to Get Started?</h3>
              <div className="flex gap-4 justify-center">
                <Link href="/escrow" className="btn btn-primary">
                  Create Escrow
                </Link>
                <Link href="/debug" className="btn btn-outline">
                  Debug Contracts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
