import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";

interface Vlog {
  id: string;
  title: string;
  description: string;
  image_url: string;
}

// Hardcoded vlogs
const vlogs: Vlog[] = [
  {
    id: "1",
    title: "Exploring the Swiss Alps",
    description: "Join us on an incredible journey through the majestic Swiss Alps, discovering hidden trails, breathtaking mountain views, and charming alpine villages. Experience the thrill of hiking through pristine landscapes and witness nature at its finest.",
    image_url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=600&fit=crop"
  },
  {
    id: "2",
    title: "Tokyo Street Food Adventure",
    description: "Dive into the vibrant food culture of Tokyo as we explore the best street food locations, from bustling night markets to hidden izakayas. Taste authentic ramen, fresh sushi, takoyaki, and discover the flavors that make Japanese cuisine world-renowned.",
    image_url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop"
  },
  {
    id: "3",
    title: "Safari Adventure in Kenya",
    description: "Witness the incredible wildlife of Kenya in this unforgettable safari experience. Get up close with elephants, lions, giraffes, and zebras in their natural habitat. Experience the raw beauty of the African savanna and create memories that will last a lifetime.",
    image_url: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&h=600&fit=crop"
  },
  {
    id: "4",
    title: "Diving the Great Barrier Reef",
    description: "Explore the underwater wonders of Australia's Great Barrier Reef, one of the seven natural wonders of the world. Swim alongside colorful coral formations, tropical fish, sea turtles, and experience the marine biodiversity that makes this reef system truly magical.",
    image_url: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=600&fit=crop"
  },
  {
    id: "5",
    title: "Northern Lights in Iceland",
    description: "Chase the aurora borealis across Iceland's dramatic landscapes. From volcanic terrain to glacial lagoons, witness the dancing lights of the Northern Lights painting the sky in shades of green and purple. A once-in-a-lifetime natural phenomenon.",
    image_url: "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800&h=600&fit=crop"
  },
  {
    id: "6",
    title: "Temples of Angkor Wat",
    description: "Journey through the ancient temples of Angkor Wat in Cambodia. Explore the magnificent stone structures, intricate carvings, and spiritual history of one of the world's most important archaeological sites. Experience sunrise over these mystical ruins.",
    image_url: "https://images.unsplash.com/photo-1563624162-37f9f6d39f3f?w=800&h=600&fit=crop"
  },
  {
    id: "7",
    title: "Santorini Sunset Tour",
    description: "Experience the romance and beauty of Santorini, Greece. Walk through the iconic white-washed villages with blue-domed churches, explore volcanic beaches, and witness the most spectacular sunsets over the Aegean Sea from the cliffs of Oia.",
    image_url: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800&h=600&fit=crop"
  },
  {
    id: "8",
    title: "Amazon Rainforest Expedition",
    description: "Venture deep into the Amazon rainforest, the world's largest tropical rainforest. Discover exotic wildlife, indigenous cultures, and the incredible biodiversity of this vital ecosystem. Navigate through rivers and experience nature in its purest form.",
    image_url: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&h=600&fit=crop"
  }
];

const Vlog = () => {

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Travel Vlogs</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vlogs.map((vlog) => (
            <Card
              key={vlog.id}
              className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
            >
              <img
                src={vlog.image_url}
                alt={vlog.title}
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <h3 className="font-bold text-xl mb-3">{vlog.title}</h3>
                <p className="text-muted-foreground">{vlog.description}</p>
              </div>
            </Card>
          ))}
        </div>

      </main>

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default Vlog;