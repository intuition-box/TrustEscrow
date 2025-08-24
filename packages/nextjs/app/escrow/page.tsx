import { ScaffoldEthAppWithProviders } from "../../components/ScaffoldEthAppWithProviders";
import TrustEscrowApp from "../../components/TrustEscrowApp";

export default function EscrowPage() {
  return (
    <ScaffoldEthAppWithProviders>
      <TrustEscrowApp />
    </ScaffoldEthAppWithProviders>
  );
}
