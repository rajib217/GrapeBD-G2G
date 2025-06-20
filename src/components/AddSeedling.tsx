
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Plus, Leaf } from 'lucide-react';

const AddSeedling = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    quantity: '',
    description: '',
  });

  const seedlingTypes = [
    'ফলের গাছ',
    'ঔষধি গাছ',
    'ফুলের গাছ',
    'কাঠের গাছ',
    'সবজির চারা',
    'মসলার গাছ',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.quantity) {
      toast({
        title: "ত্রুটি",
        description: "সকল প্রয়োজনীয় ক্ষেত্র পূরণ করুন",
        variant: "destructive",
      });
      return;
    }

    // এখানে API কল করে ডেটাবেসে সেভ করা হবে
    console.log('New seedling:', formData);
    
    toast({
      title: "সফল!",
      description: `${formData.name} আপনার স্টকে যোগ করা হয়েছে`,
    });

    // ফর্ম রিসেট করা
    setFormData({
      name: '',
      type: '',
      quantity: '',
      description: '',
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Plus className="h-6 w-6 text-green-600" />
            <CardTitle className="text-2xl text-green-700">নতুন চারা যোগ করুন</CardTitle>
          </div>
          <CardDescription>
            আপনার স্টকে নতুন চারা যোগ করুন যাতে অন্যরা জানতে পারে
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">চারার নাম *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="যেমন: আমের চারা, নিমের চারা"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">চারার ধরন *</Label>
              <Select onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="চারার ধরন নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {seedlingTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">পরিমাণ *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="কতটি চারা আছে?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">বিবরণ</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="চারা সম্পর্কে অতিরিক্ত তথ্য লিখুন..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
              <Leaf className="h-4 w-4 mr-2" />
              স্টকে যোগ করুন
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Add Templates */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">জনপ্রিয় চারা</CardTitle>
          <CardDescription>দ্রুত যোগ করতে ক্লিক করুন</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: 'আমের চারা', type: 'ফলের গাছ' },
              { name: 'জামের চারা', type: 'ফলের গাছ' },
              { name: 'নিমের চারা', type: 'ঔষধি গাছ' },
              { name: 'তুলসী গাছ', type: 'ঔষধি গাছ' },
              { name: 'গোলাপ', type: 'ফুলের গাছ' },
              { name: 'টমেটো', type: 'সবজির চারা' },
            ].map((template) => (
              <Button
                key={template.name}
                variant="outline"
                className="h-auto p-3 text-left"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    name: template.name,
                    type: template.type,
                  }));
                }}
              >
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-gray-500">{template.type}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddSeedling;
