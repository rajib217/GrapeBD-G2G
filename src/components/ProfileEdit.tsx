import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Save, Upload, Plus, X, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/utils/imageCompression';

const ProfileEdit = () => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    courier_address: '',
    profile_image: '',
    preferred_courier: '',
    bio: '',
    g2g_rounds: ''
  });
  const [varieties, setVarieties] = useState<any[]>([]);
  const [userVarieties, setUserVarieties] = useState<any[]>([]);
                id="g2g_rounds"
                type="text"
                value={formData.g2g_rounds}
                onChange={(e) => handleInputChange('g2g_rounds', e.target.value)}
                placeholder="রাউন্ড নাম্বার (কমা দিয়ে পৃথক করুন) যেমন: R1, R2, R3"
              />
              <p className="text-sm text-muted-foreground mt-1">
                যে সব G2G রাউন্ডে অংশগ্রহণ করেছেন তার তালিকা
              </p>
            </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'সংরক্ষণ করা হচ্ছে...' : 'প্রোফাইল সংরক্ষণ করুন'}
              </Button>
            </form>
          </CardContent>
        </Card>
        </TabsContent>

        {/* User Varieties Tab */}
        <TabsContent value="varieties">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>আমার জাত সমূহ</span>
              </CardTitle>
              <CardDescription>
                আপনার কাছে যে জাতগুলো আছে তা যোগ করুন
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Variety */}
              <div className="flex space-x-2">
                <Select value={selectedVarietyId} onValueChange={setSelectedVarietyId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="জাত নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {varieties.filter(v => !userVarieties.some(uv => uv.variety_id === v.id)).map((variety) => (
                      <SelectItem key={variety.id} value={variety.id}>
                        {variety.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addUserVariety} disabled={!selectedVarietyId}>
                  <Plus className="h-4 w-4 mr-2" />
                  যোগ করুন
                </Button>
              </div>

              {/* User Varieties List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userVarieties.map((userVariety) => (
                  <div key={userVariety.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {userVariety.varieties?.thumbnail_image && (
                          <img 
                            src={userVariety.varieties.thumbnail_image} 
                            alt={userVariety.varieties?.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{userVariety.varieties?.name}</h4>
                          {userVariety.notes && (
                            <p className="text-sm text-muted-foreground">{userVariety.notes}</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => removeUserVariety(userVariety.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {userVarieties.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  এখনো কোন জাত যোগ করা হয়নি
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Received Gift Varieties Tab */}
        <TabsContent value="gifts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>G2G থেকে প্রাপ্ত জাত</span>
              </CardTitle>
              <CardDescription>
                G2G গিফট হিসেবে প্রাপ্ত জাতের তালিকা
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {receivedGiftVarieties.map((giftVariety) => (
                  <div key={giftVariety.variety_id} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      {giftVariety.variety_thumbnail && (
                        <img 
                          src={giftVariety.variety_thumbnail} 
                          alt={giftVariety.variety_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{giftVariety.variety_name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary">
                            {giftVariety.gift_count}টি গিফট
                          </Badge>
                        </div>
                        {giftVariety.latest_gift_date && (
                          <p className="text-sm text-muted-foreground mt-1">
                            সর্বশেষ: {new Date(giftVariety.latest_gift_date).toLocaleDateString('bn-BD')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {receivedGiftVarieties.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  এখনো কোন গিফট পাননি
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileEdit;