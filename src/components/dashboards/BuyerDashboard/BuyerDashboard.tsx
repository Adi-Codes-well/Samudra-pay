import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";
import { Progress } from "../../ui/progress";
import { projectId } from "../../../utils/supabase/info";
import { supabase } from "../../../utils/supabase/client";
import {
  ShoppingCart,
  Award,
  TrendingUp,
  Leaf,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { WalletConnect } from "../../WalletConnect";
import { StatsCard } from "./StatsCard";
import { CreditCard } from "./CreditCard";
import { PurchaseDialog } from "./PurchaseDialog";
import { RetirementDialog } from "./RetirementDialog";
import { RetirementHistory } from "./RetirementHistory";
import { User, CarbonCredit, Retirement } from "../../../types/dashboard";

interface BuyerDashboardProps {
  user: User;
}

export function BuyerDashboard({ user }: BuyerDashboardProps) {
  const [availableCredits, setAvailableCredits] = useState<CarbonCredit[]>([]);
  const [ownedCredits, setOwnedCredits] = useState<CarbonCredit[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<CarbonCredit | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showRetirementDialog, setShowRetirementDialog] = useState(false);
  const [retirementReason, setRetirementReason] = useState("");
  const [retirements, setRetirements] = useState<Retirement[]>([]);
  const [purchaseAmount, setPurchaseAmount] = useState(1);

  useEffect(() => {
    fetchAvailableCredits();
    fetchOwnedCredits();
  }, []);

  const fetchAvailableCredits = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/credits/available`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch available credits");
      }

      const data = await response.json();
      setAvailableCredits(data.availableCredits || []);
    } catch (error) {
      console.error("Error fetching available credits:", error);
      toast.error("Failed to load available credits");
    }
  };

  const fetchOwnedCredits = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/credits/owned`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch owned credits");
      }

      const data = await response.json();
      setOwnedCredits(data.ownedCredits || []);
    } catch (error) {
      console.error("Error fetching owned credits:", error);
      toast.error("Failed to load owned credits");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (
      !selectedCredit ||
      purchaseAmount < 1 ||
      purchaseAmount > selectedCredit.amount
    )
      return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/credits/purchase`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            creditId: selectedCredit.id,
            amount: purchaseAmount,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to purchase credit");
      }

      toast.success(`Successfully purchased ${purchaseAmount} tCO₂e credits!`);
      setShowPurchaseDialog(false);
      setSelectedCredit(null);

      // Refresh both available and owned credits
      fetchAvailableCredits();
      fetchOwnedCredits();
    } catch (error) {
      const err = error as Error;
      console.error("Error purchasing credits:", err.message);
      toast.error(`Failed to purchase credits: ${err.message}`);
    }
  };

  const handleRetirement = async () => {
    if (!selectedCredit || !retirementReason.trim()) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a82c4acb/credits/retire`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            creditId: selectedCredit.id,
            reason: retirementReason,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to retire credits");
      }

      const data = await response.json();
      toast.success(
        `Successfully retired ${selectedCredit.amount} tCO₂e credits!`
      );
      setRetirements((prev) => [data.retirement, ...prev]);

      // Refresh owned credits to remove retired credit
      fetchOwnedCredits();

      setShowRetirementDialog(false);
      setRetirementReason("");
      setSelectedCredit(null);
    } catch (error) {
      const err = error as Error;
      console.error("Error retiring credits:", err.message);
      toast.error(`Failed to retire credits: ${err.message}`);
    }
  };

  const openPurchaseDialog = (credit: CarbonCredit) => {
    setSelectedCredit(credit);
    setPurchaseAmount(1);
    setShowPurchaseDialog(true);
  };

  const openRetirementDialog = (credit: CarbonCredit) => {
    setSelectedCredit(credit);
    setRetirementReason("");
    setShowRetirementDialog(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6 text-green-600" />
            <span>Carbon Credit Marketplace</span>
          </h2>
          <p className="text-gray-600">
            Purchase and retire verified blue carbon credits
          </p>
        </div>
        <WalletConnect variant="button-only" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Owned Credits"
          value={ownedCredits.reduce((sum, credit) => sum + credit.amount, 0)}
          unit="tCO₂e"
          description="Available for retirement"
          icon={ShoppingCart}
          color="green"
        />
        <StatsCard
          title="Available Credits"
          value={availableCredits.reduce(
            (sum, credit) => sum + credit.amount,
            0
          )}
          unit="tCO₂e"
          description="In marketplace"
          icon={Award}
          color="blue"
        />
        <StatsCard
          title="Premium Credits"
          value={
            availableCredits.filter((credit) => credit.healthScore >= 0.8)
              .length
          }
          unit=""
          description="High-quality projects"
          icon={TrendingUp}
          color="purple"
        />
        <StatsCard
          title="Retired Credits"
          value={retirements.reduce(
            (sum, retirement) => sum + retirement.amount,
            0
          )}
          unit="tCO₂e"
          description="Your offset impact"
          icon={Leaf}
          color="teal"
        />
      </div>

      {/* Available Credits Marketplace */}
      <Card>
        <CardHeader>
          <CardTitle>Available Carbon Credits</CardTitle>
          <CardDescription>
            Purchase verified blue carbon credits from coastal restoration
            projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableCredits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No credits available for purchase</p>
              <p className="text-sm mt-2">
                Check back later for new verified projects
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCredits.map((credit) => (
                <CreditCard
                  key={credit.id}
                  credit={credit}
                  type="available"
                  onAction={openPurchaseDialog}
                  actionLabel="Purchase"
                  actionIcon={ShoppingCart}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Owned Credits for Retirement */}
      {ownedCredits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Owned Credits</CardTitle>
            <CardDescription>
              Credits you own and can retire for carbon offsetting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ownedCredits.map((credit) => (
                <CreditCard
                  key={credit.id}
                  credit={credit}
                  type="owned"
                  onAction={openRetirementDialog}
                  actionLabel="Retire Credit"
                  actionIcon={Leaf}
                  actionClass="bg-green-600 hover:bg-green-700"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retirement History */}
      {retirements.length > 0 && (
        <RetirementHistory retirements={retirements} />
      )}

      {/* Purchase Dialog */}
      <PurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        credit={selectedCredit}
        purchaseAmount={purchaseAmount}
        onPurchaseAmountChange={setPurchaseAmount}
        onPurchase={handlePurchase}
      />

      {/* Retirement Dialog */}
      <RetirementDialog
        open={showRetirementDialog}
        onOpenChange={setShowRetirementDialog}
        credit={selectedCredit}
        retirementReason={retirementReason}
        onRetirementReasonChange={setRetirementReason}
        onRetire={handleRetirement}
      />
    </div>
  );
}
