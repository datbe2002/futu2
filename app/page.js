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
};

export default function Home() {
  const [formData, setFormData] = useState(initialFormState);

  const [errors, setErrors] = useState({
    entryPrice: "",
    positionSize: "",
    stopLoss: "",
    takeProfit: "",
  });

  const [results, setResults] = useState(null);

  const handleClearForm = () => {
    setFormData(initialFormState);
    setErrors({
      entryPrice: "",
      positionSize: "",
      stopLoss: "",
      takeProfit: "",
    });
    setResults(null);
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
      </main>
    </div>
  );
}
