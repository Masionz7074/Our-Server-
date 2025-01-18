import React, { useState } from 'react';
import { Copy, Coins, ShoppingCart } from 'lucide-react';

interface CommandResult {
  commands: string[];
}

function App() {
  const [purchaseResult, setPurchaseResult] = useState<CommandResult | null>(null);
  const [saleResult, setSaleResult] = useState<CommandResult | null>(null);

  const generatePurchaseCommands = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const item = formData.get('itemPurchase') as string;
    const quantity = formData.get('quantityPurchase') as string;
    const price = formData.get('pricePurchase') as string;
    const scoreboard = formData.get('scoreboardPurchase') as string;
    const success = formData.get('successPurchase') as string;
    const error = formData.get('errorPurchase') as string;

    const commands = [
      `/give @initiator[scores={${scoreboard}=${price}..}] ${item} ${quantity}`,
      `/tellraw @initiator[scores={${scoreboard}=${price}..}] {"rawtext":[{"text":"${success}§r"}]}`,
      `/tellraw @initiator[scores={${scoreboard}=..${Number(price) - 1}}] {"rawtext":[{"text":"${error}§r"}]}`,
      `/playsound mob.villager.yes @initiator[scores={${scoreboard}=${price}..}]`,
      `/playsound mob.villager.no @initiator[scores={${scoreboard}=..${Number(price) - 1}}]`,
      `/scoreboard players remove @initiator[scores={${scoreboard}=${price}..}] ${scoreboard} ${price}`
    ];

    setPurchaseResult({ commands });
  };

  const generateSaleCommands = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const item = formData.get('itemSale') as string;
    const quantity = formData.get('quantitySale') as string;
    const price = formData.get('priceSale') as string;
    const scoreboard = formData.get('scoreboardSale') as string;
    const success = formData.get('successSale') as string;
    const error = formData.get('errorSale') as string;

    const commands = [
      `/tellraw @initiator[hasitem={item=${item},quantity=${quantity}..}] {"rawtext":[{"text":"${success}§r"}]}`,
      `/playsound mob.villager.yes @initiator[hasitem={item=${item},quantity=${quantity}..}]`,
      `/tellraw @initiator[hasitem={item=${item},quantity=..${Number(quantity) - 1}}] {"rawtext":[{"text":"${error}§r"}]}`,
      `/playsound mob.villager.no @initiator[hasitem={item=${item},quantity=..${Number(quantity) - 1}}]`,
      `/scoreboard players add @initiator[hasitem={item=${item},quantity=${quantity}..}] ${scoreboard} ${price}`,
      `/clear @initiator[hasitem={item=${item},quantity=${quantity}..}] ${item} 0 ${quantity}`
    ];

    setSaleResult({ commands });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-[#2A2A2A] bg-[url('https://images.unsplash.com/photo-1627934119363-4b655613125f?auto=format&fit=crop&q=80')] bg-cover bg-center bg-blend-overlay">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-emerald-400 text-center mb-8">Minecraft Command Generator</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Purchase Form */}
          <div className="bg-gray-900 bg-opacity-90 p-6 rounded-lg border-2 border-emerald-600">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingCart className="text-emerald-400" />
              <h2 className="text-2xl font-bold text-emerald-400">Purchase Commands</h2>
            </div>
            
            <form onSubmit={generatePurchaseCommands} className="space-y-4">
              <FormInput name="itemPurchase" label="Item to Buy" />
              <FormInput name="quantityPurchase" label="Quantity" type="number" />
              <FormInput name="pricePurchase" label="Price" type="number" />
              <FormInput name="scoreboardPurchase" label="Scoreboard" />
              <FormInput name="successPurchase" label="Success Message" />
              <FormInput name="errorPurchase" label="Error Message" />
              
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition">
                Generate Commands
              </button>
            </form>

            {purchaseResult && (
              <CommandOutput commands={purchaseResult.commands} />
            )}
          </div>

          {/* Sale Form */}
          <div className="bg-gray-900 bg-opacity-90 p-6 rounded-lg border-2 border-emerald-600">
            <div className="flex items-center gap-2 mb-6">
              <Coins className="text-emerald-400" />
              <h2 className="text-2xl font-bold text-emerald-400">Sale Commands</h2>
            </div>
            
            <form onSubmit={generateSaleCommands} className="space-y-4">
              <FormInput name="itemSale" label="Item to Sell" />
              <FormInput name="quantitySale" label="Quantity" type="number" />
              <FormInput name="priceSale" label="Price" type="number" />
              <FormInput name="scoreboardSale" label="Scoreboard" />
              <FormInput name="successSale" label="Success Message" />
              <FormInput name="errorSale" label="Error Message" />
              
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition">
                Generate Commands
              </button>
            </form>

            {saleResult && (
              <CommandOutput commands={saleResult.commands} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FormInputProps {
  name: string;
  label: string;
  type?: string;
}

function FormInput({ name, label, type = "text" }: FormInputProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-emerald-400 mb-1">
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        required
        className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}

interface CommandOutputProps {
  commands: string[];
}

function CommandOutput({ commands }: CommandOutputProps) {
  return (
    <div className="mt-6 bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-emerald-400 font-semibold">Generated Commands:</h4>
        <button
          onClick={() => copyToClipboard(commands.join('\n'))}
          className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
        >
          <Copy size={16} />
          Copy All
        </button>
      </div>
      <pre className="text-white text-sm whitespace-pre-wrap break-all">
        {commands.join('\n')}
      </pre>
    </div>
  );
}

export default App;