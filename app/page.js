"use client";

import { useState } from "react";

// Constants
const leverageArr = [
  1, 2, 3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 75, 80, 90, 100, 125,
  150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500,
];

const initialFormState = {
  entryPrice: "",
  leverage: "1",
  positionSize: "",
  orderType: "long",
  stopLoss: "",
  takeProfit: "",
  currentPrice: "",
  dcaAmount: "",
  targetEntry: "",
  dcaTriangleAmount: "",
  dcaTrianglePrice: "",
  dcaTriangleTarget: "",
  dcaTriangleScenario: "1", // 1, 2, or 3
};

const initialErrorState = {
  entryPrice: "",
  positionSize: "",
  stopLoss: "",
  takeProfit: "",
  currentPrice: "",
  dcaAmount: "",
  targetEntry: "",
  dcaTriangleAmount: "",
  dcaTrianglePrice: "",
  dcaTriangleTarget: "",
};

// Input Field Component
const InputField = ({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  tooltip,
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <label className="block text-sm font-semibold text-gray-800">
        {label}
      </label>
      {tooltip && (
        <div className="group relative">
          <span className="cursor-help text-gray-400 hover:text-gray-600">
            ⓘ
          </span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
            {tooltip}
          </div>
        </div>
      )}
    </div>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
        error ? "border-red-500" : ""
      }`}
      placeholder={placeholder}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// Results Card Component
const ResultCard = ({
  title,
  value,
  subtitle,
  bgColor = "bg-gray-50",
  textColor = "text-gray-900",
}) => (
  <div className={`${bgColor} p-6 rounded-xl`}>
    <p className="text-sm font-semibold text-gray-600 mb-1">{title}</p>
    <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
  </div>
);

export default function Home() {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState(initialErrorState);
  const [results, setResults] = useState(null);
  const [dcaResults, setDcaResults] = useState(null);
  const [activeTab, setActiveTab] = useState("triangle"); // 'position', 'dca', or 'target'

  // Validation function
  const validateNumber = (value, fieldName) => {
    if (value === "") {
      return `${fieldName} is required`;
    }
    if (isNaN(value) || !/^\d*\.?\d*$/.test(value)) {
      return `${fieldName} must be a valid number`;
    }
    if (parseFloat(value) <= 0) {
      return `${fieldName} must be greater than 0`;
    }
    return "";
  };

  const calculateDCA = () => {
    const { entryPrice, leverage, positionSize, currentPrice, dcaAmount } =
      formData;

    // Convert inputs to numbers
    const entry = parseFloat(entryPrice);
    const current = parseFloat(currentPrice);
    const lev = parseFloat(leverage);
    const size = parseFloat(positionSize);
    const dca = parseFloat(dcaAmount);

    // Real money calculations (without leverage)
    const originalInvestment = size; // Original money invested
    const dcaInvestment = dca; // DCA money invested
    const totalInvestment = originalInvestment + dcaInvestment; // Total real money invested

    // Calculate contract quantities
    const originalContractQty = (size * lev) / entry;
    const dcaContractQty = (dca * lev) / current;
    const totalContractQty = originalContractQty + dcaContractQty;

    // Calculate new average entry price
    const newAverageEntry =
      ((originalInvestment + dcaInvestment) * lev) / totalContractQty;

    // Calculate real PnL
    const currentValue = (totalContractQty * current) / lev; // Current value in real money
    const unrealizedPnL = currentValue - totalInvestment; // Real money profit/loss

    // Calculate ROI percentage
    const roiPercentage = (unrealizedPnL / totalInvestment) * 100;

    // Calculate breakeven price change needed from current price
    const breakevenPriceChange = ((newAverageEntry - current) / current) * 100;

    setDcaResults({
      newAverageEntry: newAverageEntry.toFixed(2),
      totalInvestment: totalInvestment.toFixed(2),
      currentValue: currentValue.toFixed(2),
      unrealizedPnL: unrealizedPnL.toFixed(2),
      roiPercentage: roiPercentage.toFixed(2),
      breakevenPriceChange: breakevenPriceChange.toFixed(2),
      originalInvestment: originalInvestment.toFixed(2),
      dcaInvestment: dcaInvestment.toFixed(2),
      totalContractQty: totalContractQty.toFixed(4),
      leveragedPosition: (totalInvestment * lev).toFixed(2),
    });
  };

  const calculateTargetDCA = () => {
    const { entryPrice, leverage, positionSize, currentPrice, targetEntry } =
      formData;

    if (!targetEntry) return;

    // Convert inputs to numbers
    const entry = parseFloat(entryPrice);
    const current = parseFloat(currentPrice);
    const target = parseFloat(targetEntry);
    const size = parseFloat(positionSize);
    const lev = parseFloat(leverage);

    // Calculate required DCA amount to reach target entry
    const originalContractQty = (size * lev) / entry;
    const totalContractsNeeded = (size * lev) / target;
    const additionalContractsNeeded =
      totalContractsNeeded - originalContractQty;
    const dcaAmountNeeded = (additionalContractsNeeded * current) / lev;

    // Calculate total position after DCA
    const totalInvestment = size + dcaAmountNeeded;
    const totalPositionSize = totalInvestment * lev;

    setDcaResults((prev) => ({
      ...prev,
      targetDCA: {
        dcaAmountNeeded: dcaAmountNeeded.toFixed(2),
        newTotalInvestment: totalInvestment.toFixed(2),
        newPositionSize: totalPositionSize.toFixed(2),
        targetEntry: target.toFixed(2),
        percentageIncrease: ((dcaAmountNeeded / size) * 100).toFixed(2),
      },
    }));
  };

  const calculatePositionMetrics = () => {
    const {
      entryPrice,
      leverage,
      positionSize,
      orderType,
      stopLoss,
      takeProfit,
    } = formData;

    // Convert inputs to numbers
    const entry = parseFloat(entryPrice);
    const lev = parseFloat(leverage);
    const size = parseFloat(positionSize);
    const sl = parseFloat(stopLoss);
    const tp = parseFloat(takeProfit);

    // Calculate position metrics
    const totalPosition = size * lev;
    const liquidationPrice =
      orderType === "long" ? entry * (1 - 1 / lev) : entry * (1 + 1 / lev);

    // Calculate potential profit/loss
    const potentialProfit =
      orderType === "long"
        ? ((tp - entry) / entry) * totalPosition
        : ((entry - tp) / entry) * totalPosition;

    const potentialLoss =
      orderType === "long"
        ? ((entry - sl) / entry) * totalPosition
        : ((sl - entry) / entry) * totalPosition;

    // Calculate risk reward ratio with more detail
    const riskRewardRatio = (potentialProfit / potentialLoss).toFixed(2);
    const riskRewardText = `1:${riskRewardRatio}`; // Format as 1:X

    setResults({
      totalPositionSize: totalPosition.toFixed(2),
      liquidationPrice: liquidationPrice.toFixed(2),
      potentialProfit: potentialProfit.toFixed(2),
      potentialLoss: potentialLoss.toFixed(2),
      riskRewardRatio: riskRewardText,
      isGoodRiskReward: parseFloat(riskRewardRatio) >= 2, // Generally, 1:2 or better is considered good
    });
  };

  const calculateDCATriangle = () => {
    const {
      entryPrice,
      leverage,
      positionSize,
      dcaTriangleAmount,
      dcaTrianglePrice,
      dcaTriangleTarget,
      dcaTriangleScenario,
    } = formData;

    // Convert inputs to numbers
    const entry = parseFloat(entryPrice);
    const lev = parseFloat(leverage);
    const size = parseFloat(positionSize);

    switch (dcaTriangleScenario) {
      case "1": {
        // Known: Initial position, DCA amount, desired entry
        // Calculate: Required DCA price
        const dcaAmount = parseFloat(dcaTriangleAmount);
        const targetEntry = parseFloat(dcaTriangleTarget);

        const originalContractQty = (size * lev) / entry;
        const totalCost = (size + dcaAmount) * lev;
        const totalContractsNeeded = totalCost / targetEntry;
        const additionalContractsNeeded =
          totalContractsNeeded - originalContractQty;
        const requiredDCAPrice = (dcaAmount * lev) / additionalContractsNeeded;

        setDcaResults({
          ...dcaResults,
          triangle: {
            scenario: 1,
            requiredPrice: requiredDCAPrice.toFixed(2),
            dcaAmount: dcaAmount.toFixed(2),
            targetEntry: targetEntry.toFixed(2),
            totalInvestment: (size + dcaAmount).toFixed(2),
            leveragedPosition: totalCost.toFixed(2),
          },
        });
        break;
      }
      case "2": {
        // Known: Initial position, current price, desired entry
        // Calculate: Required DCA amount
        const currentPrice = parseFloat(dcaTrianglePrice);
        const targetEntry = parseFloat(dcaTriangleTarget);

        const originalContractQty = (size * lev) / entry;
        const targetTotalContracts = (size * lev) / targetEntry;
        const additionalContractsNeeded =
          targetTotalContracts - originalContractQty;
        const requiredDCAAmount =
          (additionalContractsNeeded * currentPrice) / lev;

        setDcaResults({
          ...dcaResults,
          triangle: {
            scenario: 2,
            currentPrice: currentPrice.toFixed(2),
            requiredAmount: requiredDCAAmount.toFixed(2),
            targetEntry: targetEntry.toFixed(2),
            totalInvestment: (size + requiredDCAAmount).toFixed(2),
            leveragedPosition: ((size + requiredDCAAmount) * lev).toFixed(2),
          },
        });
        break;
      }
      case "3": {
        // Known: Initial position, current price, DCA amount
        // Calculate: Resulting average entry
        const currentPrice = parseFloat(dcaTrianglePrice);
        const dcaAmount = parseFloat(dcaTriangleAmount);

        const originalContractQty = (size * lev) / entry;
        const dcaContractQty = (dcaAmount * lev) / currentPrice;
        const totalContractQty = originalContractQty + dcaContractQty;
        const totalCost = (size + dcaAmount) * lev;
        const resultingEntry = totalCost / totalContractQty;

        setDcaResults({
          ...dcaResults,
          triangle: {
            scenario: 3,
            currentPrice: currentPrice.toFixed(2),
            dcaAmount: dcaAmount.toFixed(2),
            resultingEntry: resultingEntry.toFixed(2),
            totalInvestment: (size + dcaAmount).toFixed(2),
            leveragedPosition: totalCost.toFixed(2),
          },
        });
        break;
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name !== "orderType" && name !== "leverage") {
      const error = validateNumber(
        value,
        name.replace(/([A-Z])/g, " $1").toLowerCase()
      );
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleClearForm = () => {
    setFormData(initialFormState);
    setErrors(initialErrorState);
    setResults(null);
    setDcaResults(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields before submission
    const newErrors = {
      entryPrice: validateNumber(formData.entryPrice, "entry price"),
      positionSize: validateNumber(formData.positionSize, "position size"),
      stopLoss: validateNumber(formData.stopLoss, "stop loss"),
      takeProfit: validateNumber(formData.takeProfit, "take profit"),
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    calculatePositionMetrics();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Futures Trading Calculator
        </h1>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 bg-white p-1 rounded-xl shadow-sm">
          {[
            // { id: "position", label: "📊 Position Calculator" },
            // { id: "dca", label: "💰 DCA Calculator" },
            // { id: "target", label: "🎯 Target Entry" },
            { id: "triangle", label: "DCA Triangle Calculator" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          {/* Initial Position Section - Always visible */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Initial Position
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField
                label="Entry Price"
                name="entryPrice"
                value={formData.entryPrice}
                onChange={handleInputChange}
                error={errors.entryPrice}
                placeholder="Enter price..."
                tooltip="The price at which you entered your position"
              />

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Leverage
                </label>
                <select
                  name="leverage"
                  value={formData.leverage}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                >
                  {leverageArr.map((lev) => (
                    <option key={lev} value={lev}>
                      {lev}x
                    </option>
                  ))}
                </select>
              </div>

              <InputField
                label="Position Size (USD)"
                name="positionSize"
                value={formData.positionSize}
                onChange={handleInputChange}
                error={errors.positionSize}
                placeholder="Enter size..."
                tooltip="Your initial investment amount in USD"
              />

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Order Type
                </label>
                <select
                  name="orderType"
                  value={formData.orderType}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                >
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>

              <InputField
                label="Stop Loss Price"
                name="stopLoss"
                value={formData.stopLoss}
                onChange={handleInputChange}
                error={errors.stopLoss}
                placeholder="Enter stop loss..."
                tooltip="Price at which your position will be closed to limit losses"
              />

              <InputField
                label="Take Profit Price"
                name="takeProfit"
                value={formData.takeProfit}
                onChange={handleInputChange}
                error={errors.takeProfit}
                placeholder="Enter take profit..."
                tooltip="Price at which your position will be closed to secure profits"
              />
            </div>
          </div>

          {/* DCA Section */}
          {activeTab === "dca" && (
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                DCA Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField
                  label="Current Price"
                  name="currentPrice"
                  value={formData.currentPrice}
                  onChange={handleInputChange}
                  error={errors.currentPrice}
                  placeholder="Enter current price..."
                  tooltip="The current market price"
                />

                <InputField
                  label="DCA Amount (USD)"
                  name="dcaAmount"
                  value={formData.dcaAmount}
                  onChange={handleInputChange}
                  error={errors.dcaAmount}
                  placeholder="Enter DCA amount..."
                  tooltip="Additional amount you want to invest"
                />
              </div>
            </div>
          )}

          {/* Target Entry Section */}
          {activeTab === "target" && (
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Target Entry
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField
                  label="Current Price"
                  name="currentPrice"
                  value={formData.currentPrice}
                  onChange={handleInputChange}
                  error={errors.currentPrice}
                  placeholder="Enter current price..."
                  tooltip="The current market price"
                />

                <InputField
                  label="Desired Average Entry"
                  name="targetEntry"
                  value={formData.targetEntry}
                  onChange={handleInputChange}
                  error={errors.targetEntry}
                  placeholder="Enter target entry..."
                  tooltip="Your desired new average entry price"
                />
              </div>
            </div>
          )}

          {/* DCA Triangle Section */}
          {activeTab === "triangle" && (
            <div className="space-y-8">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      dcaTriangleScenario: "1",
                    }))
                  }
                  className={`flex-1 p-4 rounded-xl text-sm transition-all ${
                    formData.dcaTriangleScenario === "1"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <h3 className="font-bold mb-2">Scenario 1</h3>
                  <p>Known: DCA Amount & Target Entry</p>
                  <p className="text-xs mt-1 opacity-80">
                    Calculate required entry price
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      dcaTriangleScenario: "2",
                    }))
                  }
                  className={`flex-1 p-4 rounded-xl text-sm transition-all ${
                    formData.dcaTriangleScenario === "2"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <h3 className="font-bold mb-2">Scenario 2</h3>
                  <p>Known: Current Price & Target Entry</p>
                  <p className="text-xs mt-1 opacity-80">
                    Calculate required DCA amount
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      dcaTriangleScenario: "3",
                    }))
                  }
                  className={`flex-1 p-4 rounded-xl text-sm transition-all ${
                    formData.dcaTriangleScenario === "3"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <h3 className="font-bold mb-2">Scenario 3</h3>
                  <p>Known: Current Price & DCA Amount</p>
                  <p className="text-xs mt-1 opacity-80">
                    Calculate resulting entry
                  </p>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {formData.dcaTriangleScenario === "1" && (
                  <>
                    <InputField
                      label="DCA Amount (USD)"
                      name="dcaTriangleAmount"
                      value={formData.dcaTriangleAmount}
                      onChange={handleInputChange}
                      error={errors.dcaTriangleAmount}
                      placeholder="Enter DCA amount..."
                      tooltip="How much additional money you want to invest"
                    />
                    <InputField
                      label="Desired Average Entry"
                      name="dcaTriangleTarget"
                      value={formData.dcaTriangleTarget}
                      onChange={handleInputChange}
                      error={errors.dcaTriangleTarget}
                      placeholder="Enter target entry..."
                      tooltip="Your desired new average entry price"
                    />
                  </>
                )}

                {formData.dcaTriangleScenario === "2" && (
                  <>
                    <InputField
                      label="Current Price"
                      name="dcaTrianglePrice"
                      value={formData.dcaTrianglePrice}
                      onChange={handleInputChange}
                      error={errors.dcaTrianglePrice}
                      placeholder="Enter current price..."
                      tooltip="The current market price"
                    />
                    <InputField
                      label="Desired Average Entry"
                      name="dcaTriangleTarget"
                      value={formData.dcaTriangleTarget}
                      onChange={handleInputChange}
                      error={errors.dcaTriangleTarget}
                      placeholder="Enter target entry..."
                      tooltip="Your desired new average entry price"
                    />
                  </>
                )}

                {formData.dcaTriangleScenario === "3" && (
                  <>
                    <InputField
                      label="Current Price"
                      name="dcaTrianglePrice"
                      value={formData.dcaTrianglePrice}
                      onChange={handleInputChange}
                      error={errors.dcaTrianglePrice}
                      placeholder="Enter current price..."
                      tooltip="The current market price"
                    />
                    <InputField
                      label="DCA Amount (USD)"
                      name="dcaTriangleAmount"
                      value={formData.dcaTriangleAmount}
                      onChange={handleInputChange}
                      error={errors.dcaTriangleAmount}
                      placeholder="Enter DCA amount..."
                      tooltip="How much additional money you want to invest"
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={() => {
                switch (activeTab) {
                  case "position":
                    handleSubmit();
                    break;
                  case "dca":
                    calculateDCA();
                    break;
                  case "target":
                    calculateTargetDCA();
                    break;
                  case "triangle":
                    calculateDCATriangle();
                    break;
                }
              }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              {activeTab === "position"
                ? "Calculate Position"
                : activeTab === "dca"
                ? "Calculate DCA"
                : activeTab === "target"
                ? "Calculate Required DCA"
                : "Calculate DCA"}
            </button>
            <button
              type="button"
              onClick={handleClearForm}
              className="px-6 py-4 rounded-xl text-lg font-semibold border-2 border-gray-300 hover:bg-gray-50 transition-all text-gray-700"
            >
              Clear Form
            </button>
          </div>
        </form>

        {/* DCA Triangle Results */}
        {dcaResults?.triangle && activeTab === "triangle" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              DCA Triangle Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dcaResults.triangle.scenario === 1 && (
                <>
                  <ResultCard
                    title="Required DCA Price"
                    value={`$${dcaResults.triangle.requiredPrice}`}
                    bgColor="bg-purple-50"
                    textColor="text-purple-600"
                    subtitle="Enter at this price to reach target"
                  />
                  <ResultCard
                    title="DCA Amount"
                    value={`$${dcaResults.triangle.dcaAmount}`}
                    subtitle="Additional investment"
                  />
                </>
              )}

              {dcaResults.triangle.scenario === 2 && (
                <>
                  <ResultCard
                    title="Required DCA Amount"
                    value={`$${dcaResults.triangle.requiredAmount}`}
                    bgColor="bg-purple-50"
                    textColor="text-purple-600"
                    subtitle="Invest this amount to reach target"
                  />
                  <ResultCard
                    title="Current Price"
                    value={`$${dcaResults.triangle.currentPrice}`}
                  />
                </>
              )}

              {dcaResults.triangle.scenario === 3 && (
                <>
                  <ResultCard
                    title="Resulting Average Entry"
                    value={`$${dcaResults.triangle.resultingEntry}`}
                    bgColor="bg-purple-50"
                    textColor="text-purple-600"
                    subtitle="Your new average entry price"
                  />
                  <ResultCard
                    title="DCA Amount"
                    value={`$${dcaResults.triangle.dcaAmount}`}
                    subtitle="Additional investment"
                  />
                </>
              )}

              <ResultCard
                title="Total Investment"
                value={`$${dcaResults.triangle.totalInvestment}`}
                bgColor="bg-blue-50"
                textColor="text-blue-600"
                subtitle="Real money invested"
              />

              <ResultCard
                title="Leveraged Position"
                value={`$${dcaResults.triangle.leveragedPosition}`}
                bgColor="bg-indigo-50"
                textColor="text-indigo-600"
                subtitle="Total position size with leverage"
              />
            </div>
          </div>
        )}

        {/* Results Sections */}
        {results && activeTab === "position" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Position Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResultCard
                title="Total Position Size"
                value={`$${results.totalPositionSize}`}
              />
              <ResultCard
                title="Liquidation Price"
                value={`$${results.liquidationPrice}`}
              />
              <ResultCard
                title="Potential Profit"
                value={`$${results.potentialProfit}`}
                bgColor="bg-green-50"
                textColor="text-green-600"
              />
              <ResultCard
                title="Potential Loss"
                value={`$${results.potentialLoss}`}
                bgColor="bg-red-50"
                textColor="text-red-600"
              />
              <ResultCard
                title="Risk/Reward Ratio"
                value={results.riskRewardRatio}
                bgColor="bg-blue-50"
                textColor="text-blue-600"
                subtitle={
                  parseFloat(results.riskRewardRatio) >= 2
                    ? "✅ Good risk/reward ratio"
                    : "⚠️ Consider adjusting your take profit or stop loss"
                }
              />
            </div>
          </div>
        )}

        {dcaResults?.targetDCA && activeTab === "target" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Target Entry Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResultCard
                title="Required DCA Amount"
                value={`$${dcaResults.targetDCA.dcaAmountNeeded}`}
                bgColor="bg-purple-50"
                textColor="text-purple-600"
                subtitle={`${dcaResults.targetDCA.percentageIncrease}% of original investment`}
              />
              <ResultCard
                title="Target Average Entry"
                value={`$${dcaResults.targetDCA.targetEntry}`}
              />
              <ResultCard
                title="New Total Investment"
                value={`$${dcaResults.targetDCA.newTotalInvestment}`}
                bgColor="bg-indigo-50"
                textColor="text-indigo-600"
              />
              <ResultCard
                title="New Position Size"
                value={`$${dcaResults.targetDCA.newPositionSize}`}
                bgColor="bg-blue-50"
                textColor="text-blue-600"
              />
            </div>
          </div>
        )}

        {dcaResults && activeTab === "dca" && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              DCA Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResultCard
                title="Real Money Invested"
                value={`$${dcaResults.totalInvestment}`}
                subtitle={`Initial: $${dcaResults.originalInvestment} | DCA: $${dcaResults.dcaInvestment}`}
              />
              <ResultCard
                title="Current Value (Real Money)"
                value={`$${dcaResults.currentValue}`}
                subtitle={`With ${dcaResults.totalContractQty} contracts`}
              />
              <ResultCard
                title="Real Money P/L"
                value={`$${dcaResults.unrealizedPnL}`}
                bgColor={
                  parseFloat(dcaResults.unrealizedPnL) >= 0
                    ? "bg-green-50"
                    : "bg-red-50"
                }
                textColor={
                  parseFloat(dcaResults.unrealizedPnL) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
                subtitle={`ROI: ${dcaResults.roiPercentage}%`}
              />
              <ResultCard
                title="New Average Entry"
                value={`$${dcaResults.newAverageEntry}`}
                bgColor="bg-blue-50"
                textColor="text-blue-600"
                subtitle={`Need ${dcaResults.breakevenPriceChange}% to breakeven`}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
