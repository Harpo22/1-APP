import React, { useState } from "react";
import { AppProvider } from "./context/AppContext.jsx";
import { Layout } from "./components/Layout.jsx";
import MissionControl from "./pages/MissionControl.jsx";
import OwnerControl from "./pages/OwnerControl.jsx";
import Personal from "./pages/Personal.jsx";
import Business from "./pages/Business.jsx";
import Legacy from "./pages/Legacy.jsx";
import Reviews from "./pages/Reviews.jsx";
import Analytics from "./pages/Analytics.jsx";
import Account from "./pages/Account.jsx";

const PAGES = {
  mission: MissionControl,
  owner: OwnerControl,
  personal: Personal,
  business: Business,
  legacy: Legacy,
  reviews: Reviews,
  analytics: Analytics,
  account: Account,
};

export default function App() {
  const [active, setActive] = useState("mission");
  const Page = PAGES[active] || MissionControl;

  return (
    <AppProvider>
      <Layout active={active} setActive={setActive}>
        <div key={active} className="animate-fade-in">
          <Page />
        </div>
      </Layout>
    </AppProvider>
  );
}
