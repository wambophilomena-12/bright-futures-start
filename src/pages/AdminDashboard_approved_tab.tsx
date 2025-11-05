// Approved tab content for AdminDashboard
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const ApprovedTab = ({ approvedListings, handleRemove, handleDelete }: any) => (
  <>
    {approvedListings.length === 0 ? (
      <p className="text-muted-foreground">No approved listings</p>
    ) : (
      approvedListings.map((item: any) => (
        <Card key={item.id} className="p-6">
          <div className="flex gap-4">
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-32 h-32 object-cover rounded"
            />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{item.name}</h3>
                <Badge>{item.type}</Badge>
              </div>
              <p className="text-sm">
                <span className="font-medium">Location:</span> {item.location}, {item.place}, {item.country}
              </p>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => handleRemove(item.id, item.type)}
                  variant="outline"
                >
                  Remove from Public
                </Button>
                <Button 
                  onClick={() => handleDelete(item.id, item.type)}
                  variant="destructive"
                >
                  Delete Permanently
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))
    )}
  </>
);
