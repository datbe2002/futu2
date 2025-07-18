"use client";

import { useState } from "react";

// Create leverage array with common intervals
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
  // Add DCA fields
  currentPrice: "",
  dcaAmount: "",
  targetEntry: "", // Add new field
};

export default function Home() {
  const [formData, setFormData] = useState(initialFormState);

  const [errors, setErrors] = useState({
    entryPrice: "",
    positionSize: "",
    stopLoss: "",
    takeProfit: "",
    currentPrice: "",
    dcaAmount: "",
    targetEntry: "",
  });

  const [results, setResults] = useState(null);
  const [dcaResults, setDcaResults] = useState(null);

  const handleClearForm = () => {
    setFormData(initialFormState);
    setErrors({
      entryPrice: "",
      positionSize: "",
      stopLoss: "",
      takeProfit: "",
      currentPrice: "",
      dcaAmount: "",
      targetEntry: "",
    });
    setResults(null);
    setDcaResults(null);
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate number fields
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
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Futures Trading Calculator
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Entry Price
              </label>
              <input
                type="text"
                name="entryPrice"
                value={formData.entryPrice}
                onChange={handleInputChange}
                className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                  errors.entryPrice ? "border-red-500" : ""
                }`}
                required
                placeholder="Enter price..."
              />
              {errors.entryPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.entryPrice}</p>
              )}
            </div>

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

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-black">
                Position Size (USD)
              </label>
              <input
                type="text"
                name="positionSize"
                value={formData.positionSize}
                onChange={handleInputChange}
                className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                  errors.positionSize ? "border-red-500" : ""
                }`}
                required
                placeholder="Enter size..."
              />
              {errors.positionSize && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.positionSize}
                </p>
              )}
            </div>

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

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Stop Loss Price
              </label>
              <input
                type="text"
                name="stopLoss"
                value={formData.stopLoss}
                onChange={handleInputChange}
                className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                  errors.stopLoss ? "border-red-500" : ""
                }`}
                required
                placeholder="Enter stop loss..."
              />
              {errors.stopLoss && (
                <p className="text-red-500 text-sm mt-1">{errors.stopLoss}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Take Profit Price
              </label>
              <input
                type="text"
                name="takeProfit"
                value={formData.takeProfit}
                onChange={handleInputChange}
                className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                  errors.takeProfit ? "border-red-500" : ""
                }`}
                required
                placeholder="Enter take profit..."
              />
              {errors.takeProfit && (
                <p className="text-red-500 text-sm mt-1">{errors.takeProfit}</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              DCA Calculator
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Current Price
                </label>
                <input
                  type="text"
                  name="currentPrice"
                  value={formData.currentPrice}
                  onChange={handleInputChange}
                  className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                    errors.currentPrice ? "border-red-500" : ""
                  }`}
                  placeholder="Enter current price..."
                />
                {errors.currentPrice && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.currentPrice}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  DCA Amount (USD)
                </label>
                <input
                  type="text"
                  name="dcaAmount"
                  value={formData.dcaAmount}
                  onChange={handleInputChange}
                  className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                    errors.dcaAmount ? "border-red-500" : ""
                  }`}
                  placeholder="Enter DCA amount..."
                />
                {errors.dcaAmount && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.dcaAmount}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={calculateDCA}
              className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
            >
              Calculate DCA
            </button>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Target Entry Calculator
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Desired Average Entry Price
                </label>
                <input
                  type="text"
                  name="targetEntry"
                  value={formData.targetEntry}
                  onChange={handleInputChange}
                  className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                    errors.targetEntry ? "border-red-500" : ""
                  }`}
                  placeholder="Enter target entry price..."
                />
                {errors.targetEntry && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.targetEntry}
                  </p>
                )}
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={calculateTargetDCA}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  Calculate Required DCA
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              Calculate Position
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

        {results && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Position Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Total Position Size
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${results.totalPositionSize}
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Liquidation Price
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${results.liquidationPrice}
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl">
                <p className="text-sm font-semibold text-green-600 mb-1">
                  Potential Profit
                </p>
                <p className="text-2xl font-bold text-green-600">
                  ${results.potentialProfit}
                </p>
              </div>
              <div className="bg-red-50 p-6 rounded-xl">
                <p className="text-sm font-semibold text-red-600 mb-1">
                  Potential Loss
                </p>
                <p className="text-2xl font-bold text-red-600">
                  ${results.potentialLoss}
                </p>
              </div>
              <div
                className={`p-6 rounded-xl col-span-2 ${
                  results.isGoodRiskReward ? "bg-green-50" : "bg-yellow-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">
                      Risk/Reward Ratio
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        results.isGoodRiskReward
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {results.riskRewardRatio}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm max-w-xs">
                    <p className="text-sm text-gray-600">
                      Risk/Reward ratio shows how much you risk to potentially
                      earn. A ratio of 1:2 means you risk $1 to potentially earn
                      $2. Generally, a ratio of 1:2 or better (1:3, 1:4, etc.)
                      is considered good trading practice.
                    </p>
                  </div>
                </div>
                <p className="text-sm mt-2 text-gray-600">
                  {results.isGoodRiskReward
                    ? "✅ Good risk/reward ratio - This trade has favorable risk management"
                    : "⚠️ Consider adjusting your take profit or stop loss to improve the risk/reward ratio"}
                </p>
              </div>
            </div>
          </div>
        )}

        {dcaResults && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              DCA Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Real Money Invested
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dcaResults.totalInvestment}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <p>Initial: ${dcaResults.originalInvestment}</p>
                  <p>DCA: ${dcaResults.dcaInvestment}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Current Value (Real Money)
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dcaResults.currentValue}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  With {dcaResults.totalContractQty} contracts
                </p>
              </div>

              <div
                className={`p-6 rounded-xl ${
                  parseFloat(dcaResults.unrealizedPnL) >= 0
                    ? "bg-green-50"
                    : "bg-red-50"
                }`}
              >
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Real Money P/L
                </p>
                <p
                  className={`text-2xl font-bold ${
                    parseFloat(dcaResults.unrealizedPnL) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ${dcaResults.unrealizedPnL}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  ROI: {dcaResults.roiPercentage}%
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  New Average Entry
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  ${dcaResults.newAverageEntry}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Need {dcaResults.breakevenPriceChange}% to breakeven
                </p>
              </div>

              <div className="bg-indigo-50 p-6 rounded-xl col-span-2">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Position Summary
                </p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-600">Real Money Total</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${dcaResults.totalInvestment}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      Leveraged Position Size
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      ${dcaResults.leveragedPosition}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {dcaResults?.targetDCA && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Target Entry Results
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-purple-50 p-6 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Required DCA Amount
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  ${dcaResults.targetDCA.dcaAmountNeeded}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {dcaResults.targetDCA.percentageIncrease}% of original
                  investment
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Target Average Entry
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${dcaResults.targetDCA.targetEntry}
                </p>
              </div>

              <div className="bg-indigo-50 p-6 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  New Total Investment
                </p>
                <p className="text-2xl font-bold text-indigo-600">
                  ${dcaResults.targetDCA.newTotalInvestment}
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-xl">
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  New Position Size
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  ${dcaResults.targetDCA.newPositionSize}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
