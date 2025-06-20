
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Leaf, Minus, Plus } from 'lucide-react';

interface Seedling {
  id: number;
  name: string;
  type: string;
  quantity: number;
  description: string;
  image?: string;
}

const SeedlingStock = () => {
  const [seedlings, setSeedlings] = useState<Seedling[]>([
    {
      id: 1,
      name: 'আমের চারা',
      type: 'ফলের গাছ',
      quantity: 5,
      description: 'ল্যাংড়া জাতের আমের চারা',
    },
    {
      id: 2,
      name: 'জামের চারা',
      type: 'ফলের গাছ',
      quantity: 3,
      description: 'দেশি জামের চারা',
    },
    {
      id: 3,
      name: 'নিমের চারা',
      type: 'ঔষধি গাছ',
      quantity: 8,
      description: 'ঔষধি গুণসম্পন্ন নিমের চারা',
    },
    {
      id: 4,
      name: 'তুলসী গাছ',
      type: 'ঔষধি গাছ',
      quantity: 4,
      description: 'পবিত্র তুলসী গাছের চারা',
    },
    {
      id: 5,
      name: 'গোলাপের চারা',
      type: 'ফুলের গাছ',
      quantity: 6,
      description: 'লাল গোলাপের চারা',
    },
  ]);

  const updateQuantity = (id: number, change: number) => {
    setSeedlings(seedlings.map(seedling => 
      seedling.id === id 
        ? { ...seedling, quantity: Math.max(0, seedling.quantity + change) }
        : seedling
    ));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ফলের গাছ':
        return 'bg-orange-100 text-orange-800';
      case 'ঔষধি গাছ':
        return 'bg-green-100 text-green-800';
      case 'ফুলের গাছ':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-green-700">আপনার চারার স্টক</h3>
        <Badge variant="outline" className="text-lg px-3 py-1">
          মোট: {seedlings.reduce((sum, s) => sum + s.quantity, 0)} টি চারা
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {seedlings.map((seedling) => (
          <Card key={seedling.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">{seedling.name}</CardTitle>
                </div>
                <Badge className={getTypeColor(seedling.type)}>
                  {seedling.type}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {seedling.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(seedling.id, -1)}
                    disabled={seedling.quantity === 0}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-bold text-green-700 min-w-[2rem] text-center">
                    {seedling.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(seedling.id, 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">পরিমাণ</p>
                  <p className="text-lg font-semibold text-gray-700">{seedling.quantity} টি</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {seedlings.length === 0 && (
        <div className="text-center py-12">
          <Leaf className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">কোন চারা নেই</h3>
          <p className="text-gray-400">নতুন চারা যোগ করুন</p>
        </div>
      )}
    </div>
  );
};

export default SeedlingStock;
