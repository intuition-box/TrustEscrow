import { Suspense } from "react";
import TrustEscrowApp from "../../components/TrustEscrowApp";

export default function EscrowPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrustEscrowApp />
    </Suspense>
  );
}
