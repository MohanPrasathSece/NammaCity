const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');

// @desc    Chat with the bot
// @route   POST /api/chat
// @access  Private
const chatWithBot = asyncHandler(async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }

  console.log('[Chat] Processing message:', message.substring(0, 50) + '...');

  try {
    // Generate response using real seeded data
    let botResponse = await generateResponseWithSeededData(message, history);
    
    console.log('[Chat] Generated response:', botResponse.substring(0, 50) + '...');
    
    // Return response in expected format
    res.json({ role: 'assistant', content: botResponse });
  } catch (error) {
    console.error('[Chat] Error:', error.message);
    res.status(500).json({ message: 'Sorry, I\'m having trouble right now. Please try again.' });
  }
});

// Generate responses using actual seeded data from database
async function generateResponseWithSeededData(message, history) {
  const lowerMessage = message.toLowerCase();
  
  // Food & Restaurant Information using real seeded data
  if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('restaurant') || lowerMessage.includes('meal')) {
    try {
      const foodServices = await Service.find({ 
        category: 'food',
        isActive: true 
      }).select('name description location.address contact.phone priceRange specialOffers timings tags');

      if (foodServices.length === 0) {
        return "I don't have any food places in my database right now. Please check the map for nearby options.";
      }

      if (lowerMessage.includes('cheap') || lowerMessage.includes('affordable') || lowerMessage.includes('budget')) {
        const cheapFood = foodServices.filter(s => s.priceRange === '₹' || s.priceRange === 'FREE');
        if (cheapFood.length > 0) {
          let response = `🍽️ **Affordable Food Places in Coimbatore:**\n\n`;
          cheapFood.forEach(place => {
            response += `**${place.name}**\n`;
            response += `📍 ${place.location.address}\n`;
            response += `💰 ${place.priceRange === 'FREE' ? 'FREE' : 'Budget-friendly'}\n`;
            response += `📞 ${place.contact.phone}\n`;
            if (place.specialOffers) {
              response += `🎁 ${place.specialOffers}\n`;
            }
            response += `ℹ️ ${place.description}\n\n`;
          });
          response += `Use the Food category on the map to get directions to these places!`;
          return response;
        }
      }

      if (lowerMessage.includes('free')) {
        const freeFood = foodServices.filter(s => s.priceRange === 'FREE');
        if (freeFood.length > 0) {
          let response = `🆓 **FREE Food Places in Coimbatore:**\n\n`;
          freeFood.forEach(place => {
            response += `**${place.name}**\n`;
            response += `📍 ${place.location.address}\n`;
            response += `⏰ ${place.timings.monday.open} - ${place.timings.monday.close}\n`;
            response += `📞 ${place.contact.phone}\n`;
            response += `ℹ️ ${place.description}\n\n`;
          });
          return response;
        }
      }

      // General food recommendations
      let response = `🍽️ **Food Places Available in Coimbatore:**\n\n`;
      foodServices.slice(0, 5).forEach(place => {
        response += `**${place.name}** (${place.priceRange})\n`;
        response += `📍 ${place.location.address}\n`;
        response += `📞 ${place.contact.phone}\n`;
        response += `ℹ️ ${place.description.substring(0, 80)}...\n\n`;
      });
      
      if (foodServices.length > 5) {
        response += `...and ${foodServices.length - 5} more places!\n\n`;
      }
      
      response += `Use the Food category on the map to see all locations with directions!`;
      return response;

    } catch (error) {
      console.error('Error fetching food data:', error);
      return "I'm having trouble accessing the food database right now. Please try the Food section on the map.";
    }
  }
  
  // Enhanced Hotel & Accommodation Information
  if (lowerMessage.includes('shelter') || lowerMessage.includes('stay') || lowerMessage.includes('hotel')) {
    if (lowerMessage.includes('best') || lowerMessage.includes('luxury') || lowerMessage.includes('good')) {
      return `🏨 **Best Hotels in Coimbatore:**

**Luxury Hotels:**
• Vivanta Coimbatore - 5-star luxury near airport
• Le Meridien Coimbatore - Premium business hotel
• The Residency Towers - Central location, great service

**Mid-Range Hotels:**
• Hotel City Tower - Near railway station
• FabHotel Prime - Modern amenities, good value
• Treebo Trend - Clean, affordable, multiple locations

**Budget Options:**
• Hotel Tamil Nadu (TTDC) - Government run, reliable
• Lodge options near Railway Station & Gandhipuram
• PG accommodations in RS Puram area

**Areas to Stay:**
• **RS Puram** - Upscale, close to shopping
• **Gandhipuram** - Central, well-connected
• **Peelamedu** - Near airport & IT companies
• **Railway Station area** - Budget options, transport hub

Check the Shelter section on the map for real-time availability and booking options!`;
    }
    if (lowerMessage.includes('near') || lowerMessage.includes('closest') || lowerMessage.includes('nearby')) {
      return `🏨 **Finding Nearest Hotels:**

**Near Railway Station:**
• Hotel City Tower (2 min walk)
• Railway Retiring Rooms (on platform)
• Multiple budget lodges within 500m

**Near Bus Stand (Gandhipuram):**
• Hotel KPM Residency
• Suguna Lodge
• Several budget options within walking distance

**Near Airport (Peelamedu):**
• Vivanta Coimbatore (5 min drive)
• Multiple business hotels on Avinashi Road

**Quick Tips:**
• Use the map's Shelter category to see exact distances
• Filter by price range and amenities
• Check real-time availability

Tap on any hotel marker on the map for directions and contact details!`;
    }
    return "For accommodation in Coimbatore, check the Shelter section on the map. You'll find budget hotels, lodges, and temporary stays especially around the railway station and bus stand areas.";
  }
  
  if (lowerMessage.includes('restroom') || lowerMessage.includes('toilet') || lowerMessage.includes('bathroom')) {
    return "Public restrooms are available throughout Coimbatore. Check the Restrooms category on the map to find the nearest clean facilities. Many are located near bus stops, railway stations, and public parks.";
  }
  
  if (lowerMessage.includes('study') || lowerMessage.includes('library') || lowerMessage.includes('wifi')) {
    return "Great study spots in Coimbatore include public libraries, cafes with WiFi, and co-working spaces. Check the Study Zones section on the map for quiet places to work or study.";
  }
  
  // Enhanced Transport Information
  if (lowerMessage.includes('transport') || lowerMessage.includes('bus') || lowerMessage.includes('auto') || lowerMessage.includes('taxi') || lowerMessage.includes('travel')) {
    if (lowerMessage.includes('bus') || lowerMessage.includes('public')) {
      return `🚌 **Public Transport in Coimbatore:**

**City Bus Service:**
• **TNSTC** (Tamil Nadu State Transport) - Main operator
• Frequency: Every 5-15 minutes on major routes
• Fare: ₹5-25 depending on distance
• Operating Hours: 5:00 AM - 11:00 PM

**Major Bus Stands:**
• **Gandhipuram** - Central bus stand, all city routes
• **Singanallur** - Interstate & long-distance buses
• **Town Hall** - Local city buses
• **Ukkadam** - Some city & suburban routes

**Popular Routes:**
• Gandhipuram ↔ Railway Station (Route 1, 1A)
• RS Puram ↔ Peelamedu (Route 18, 18A)
• Gandhipuram ↔ Brookefields Mall (Route 2)
• Airport ↔ Railway Station (Route 18B)

**Tips:**
• Buy tickets from conductor or use mobile apps
• Peak hours: 8-10 AM, 6-8 PM (expect crowds)
• Buses have route numbers displayed in front`;
    }
    
    if (lowerMessage.includes('auto') || lowerMessage.includes('rickshaw')) {
      return `🛺 **Auto-Rickshaws in Coimbatore:**

**Availability:**
• Easily available throughout the city
• Major stands: Railway Station, Gandhipuram, RS Puram
• Can be hailed from roadside

**Fare Structure:**
• **Meter Rate:** ₹25 for first 2km, ₹12/km after
• **Common Fixed Rates:**
  - Railway Station to Gandhipuram: ₹80-100
  - Gandhipuram to RS Puram: ₹60-80
  - Airport to City Center: ₹300-400

**Apps for Booking:**
• Ola Auto, Uber Auto available
• Namma Yatri (local app)
• Direct booking through apps shows fare upfront

**Tips:**
• Always ask for meter or negotiate fare beforehand
• Carry exact change when possible
• Peak hours may have higher rates`;
    }
    
    if (lowerMessage.includes('taxi') || lowerMessage.includes('cab') || lowerMessage.includes('ola') || lowerMessage.includes('uber')) {
      return `🚗 **Taxi & Cab Services in Coimbatore:**

**App-Based Cabs:**
• **Ola** - Most popular, good availability
• **Uber** - Available in main areas
• **Namma Yatri** - Local Coimbatore app, competitive rates

**Fare Estimates:**
• **Within City:** ₹100-300 (depending on distance)
• **Airport to City Center:** ₹400-600
• **Railway Station to RS Puram:** ₹150-250
• **Gandhipuram to Peelamedu:** ₹200-300

**Car Rental:**
• Zoomcar, Revv available for self-drive
• Local operators for driver + car service
• Daily rates: ₹2000-4000 (with driver)

**Airport Transport:**
• Prepaid taxi counter at airport
• Airport shuttle services available
• City buses (Route 18B) - cheapest option

**Tips:**
• Book cabs during peak hours in advance
• Share rides available for cost savings
• Night charges apply after 11 PM`;
    }
    
    return `🚌🛺🚗 **Transport Options in Coimbatore:**

**Public Transport:**
• City buses (₹5-25) - Gandhipuram & Singanallur stands
• Auto-rickshaws (₹25 base + ₹12/km)
• App cabs (Ola, Uber, Namma Yatri)

**Key Transport Hubs:**
• **Gandhipuram** - Central bus stand & auto stand
• **Railway Station** - Trains, buses, autos, taxis
• **Airport (Peelamedu)** - All transport options

**Quick Routes:**
• Railway Station ↔ Gandhipuram: Bus 1/1A or auto ₹80
• Airport ↔ City: Bus 18B (₹25) or taxi ₹400-600
• RS Puram ↔ Peelamedu: Bus 18/18A

Use the navigation feature in the app for real-time directions and transport options!`;
  }
  
  if (lowerMessage.includes('emergency') || lowerMessage.includes('help') || lowerMessage.includes('police')) {
    return "For emergencies in Coimbatore:\n• Police: 100\n• Fire: 101\n• Ambulance: 108\n• Women Helpline: 1091\nStay safe and don't hesitate to call for help!";
  }
  
  if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('hot')) {
    return "Coimbatore has a pleasant climate year-round. Summers (Mar-May) can be warm, monsoons (Jun-Sep) bring good rainfall, and winters (Dec-Feb) are cool and comfortable. Always carry an umbrella during monsoon season!";
  }
  
  // Shopping & Entertainment
  if (lowerMessage.includes('shopping') || lowerMessage.includes('mall') || lowerMessage.includes('market') || lowerMessage.includes('buy')) {
    return `🛍️ **Shopping in Coimbatore:**

**Malls & Shopping Centers:**
• **Brookefields Mall** - Largest mall, international brands
• **Fun Republic Mall** - Entertainment + shopping
• **Prozone Mall** - Popular local mall
• **DB City Mall** - Central location

**Traditional Markets:**
• **Big Bazaar Street** - Local goods, textiles
• **Oppanakara Street** - Traditional items, jewelry
• **Gandhi Puram Market** - Fresh produce, local items
• **RS Puram** - Branded stores, boutiques

**Textile Shopping:**
• Coimbatore is famous for cotton textiles
• **Pothys, RMKV, Nallis** - Traditional silk sarees
• **Textile shops on Cross Cut Road**

**Timings:**
• Malls: 10 AM - 10 PM
• Local markets: 9 AM - 9 PM
• Sunday: Some shops closed

**Specialties:**
• Kovai cotton, handloom products
• Wet grinders (Coimbatore specialty)
• South Indian jewelry and silk`;
  }

  // Tourist Attractions & Places to Visit
  if (lowerMessage.includes('visit') || lowerMessage.includes('tourist') || lowerMessage.includes('places') || lowerMessage.includes('attraction') || lowerMessage.includes('sightseeing')) {
    return `🏛️ **Places to Visit in Coimbatore:**

**Religious Sites:**
• **Marudamalai Temple** - Hilltop Murugan temple
• **Perur Patteeswarar Temple** - Ancient Shiva temple
• **Dhyanalinga (Isha Yoga Center)** - Spiritual center
• **Arulmigu Eachanari Vinayagar Temple**

**Nature & Parks:**
• **VOC Park & Zoo** - Family-friendly park
• **Singanallur Lake** - Bird watching, boating
• **Kovai Kutralam Falls** - Seasonal waterfall
• **Monkey Falls** - Trekking spot

**Museums & Culture:**
• **G.D. Naidu Museum** - Science & technology
• **Gedee Car Museum** - Vintage car collection
• **Textile Museum** - Local textile heritage

**Hill Stations Nearby:**
• **Ooty** (85 km) - Famous hill station
• **Coonoor** (70 km) - Tea gardens
• **Valparai** (100 km) - Coffee plantations

**Day Trip Options:**
• **Pollachi** (40 km) - Coconut town
• **Palani** (65 km) - Murugan temple
• **Kodaikanal** (175 km) - Hill station

Use the map to get directions and plan your visits!`;
  }

  // Medical & Healthcare
  if (lowerMessage.includes('hospital') || lowerMessage.includes('medical') || lowerMessage.includes('doctor') || lowerMessage.includes('health')) {
    return `🏥 **Healthcare in Coimbatore:**

**Major Hospitals:**
• **Kovai Medical Center (KMCH)** - Multi-specialty
• **PSG Hospitals** - Renowned medical care
• **Ganga Hospital** - Trauma & orthopedics
• **Sri Ramakrishna Hospital** - Comprehensive care

**Government Hospitals:**
• **Coimbatore Medical College Hospital**
• **ESI Hospital** - For employees
• **Government General Hospital**

**Pharmacies:**
• Apollo Pharmacy (24/7 locations)
• MedPlus, Netmeds available
• Local medical stores in every area

**Emergency Services:**
• Ambulance: 108 (free government service)
• Private ambulance services available
• Most hospitals have 24/7 emergency

**Medical Tourism:**
Coimbatore is known for quality healthcare at affordable costs, attracting patients from across South India.

**Areas with Medical Facilities:**
• **Avinashi Road** - Multiple hospitals
• **Race Course Road** - Specialty clinics
• **RS Puram** - Medical centers`;
  }

  if (lowerMessage.includes('namma city') || lowerMessage.includes('app') || lowerMessage.includes('how')) {
    return "Namma City helps you navigate Coimbatore easily! Use the map to find food, shelter, restrooms, and study spaces. Tap on any location for details and directions. The app is designed specifically for Coimbatore to help locals and visitors alike.";
  }
  
  // General helpful responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm your Namma City assistant. I can help you find food, shelter, restrooms, study spaces, and navigate around Coimbatore. What are you looking for today?";
  }
  
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    return "You're welcome! I'm here to help you navigate Coimbatore. Feel free to ask about any services or locations you need.";
  }
  
  // Default response with helpful suggestions
  return `I'm here to help you with Coimbatore! I can assist with:
  
• Finding food and restaurants
• Locating shelter and accommodation  
• Public restrooms and facilities
• Study spaces and libraries
• Transportation and directions
• Emergency contacts
• Local information

What would you like to know about?`;
}

module.exports = { chatWithBot };
