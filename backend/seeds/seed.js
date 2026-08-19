require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Company = require('../models/Company');
const Agent = require('../models/Agent');
const Customer = require('../models/Customer');
const Developer = require('../models/Developer');
const Project = require('../models/Project');
const Building = require('../models/Building');
const Unit = require('../models/Unit');
const Property = require('../models/Property');
const Lead = require('../models/Lead');
const Appointment = require('../models/Appointment');
const Deal = require('../models/Deal');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

const { ROLES, LEAD_STATUS_ORDER, LEAD_SOURCE, PROPERTY_TYPE, FURNISHING } = require('../utils/constants');
const {
  CITIES,
  AMENITIES,
  DEVELOPER_NAMES,
  randomFrom,
  randomInt,
  randomSubset,
  randomName,
  randomCity,
  randomLocality,
} = require('./seedData');

const PROPERTY_TYPES = Object.values(PROPERTY_TYPE);
const FURNISHING_TYPES = Object.values(FURNISHING);

const wipeDatabase = async () => {
  console.log('  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Agent.deleteMany({}),
    Customer.deleteMany({}),
    Developer.deleteMany({}),
    Project.deleteMany({}),
    Building.deleteMany({}),
    Unit.deleteMany({}),
    Property.deleteMany({}),
    Lead.deleteMany({}),
    Appointment.deleteMany({}),
    Deal.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
  ]);
};

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9',
];

const makeImages = (count = 4) =>
  Array.from({ length: count }, (_, i) => ({
    url: `${randomFrom(PLACEHOLDER_IMAGES)}?auto=format&fit=crop&w=1200&q=80&sig=${Date.now()}${i}${Math.random()}`,
    publicId: `seed/placeholder-${i}`,
    isCover: i === 0,
  }));

const seed = async () => {
  await connectDB();
  await wipeDatabase();

  console.log('  Creating super admin...');
  const superAdmin = await User.create({
    name: 'Platform Admin',
    email: 'superadmin@propflow.app',
    password: 'SuperAdmin@123',
    role: ROLES.SUPER_ADMIN,
    isEmailVerified: true,
  });

  console.log('  Creating demo company...');
  const company = await Company.create({
    name: 'Horizon Realty Group',
    email: 'admin@horizonrealty.in',
    phone: '+91-9876500001',
    subscriptionPlan: 'PROFESSIONAL',
    subscriptionStatus: 'ACTIVE',
    address: { city: 'Chandigarh', state: 'Punjab', country: 'India', pincode: '160017' },
  });

  const companyAdmin = await User.create({
    name: 'Rajiv Malhotra',
    email: 'admin@horizonrealty.in',
    password: 'Admin@123',
    role: ROLES.COMPANY_ADMIN,
    company: company._id,
    phone: '+91-9876500001',
    isEmailVerified: true,
  });
  company.createdBy = companyAdmin._id;
  await company.save();

  console.log('  Creating 32 agents...');
  const agentUsers = [];
  for (let i = 0; i < 32; i++) {
    const name = randomName();
    const email = `agent${i + 1}@horizonrealty.in`;
    const user = await User.create({
      name,
      email,
      password: 'Agent@123',
      role: i % 6 === 0 ? ROLES.BROKER : ROLES.AGENT,
      company: company._id,
      phone: `+91-98765${String(10000 + i).slice(-5)}`,
      specialization: randomFrom(['Residential', 'Luxury', 'Commercial', 'Rentals']),
      isEmailVerified: true,
    });
    await Agent.create({
      user: user._id,
      company: company._id,
      specialization: randomSubset(['Residential', 'Luxury', 'Commercial', 'Rentals', 'Plots'], 1, 3),
      experienceYears: randomInt(1, 15),
      territories: randomSubset(Object.keys(CITIES), 1, 3),
      stats: {
        propertiesListed: 0,
        leadsAssigned: 0,
        visitsCompleted: randomInt(0, 40),
        dealsClosed: 0,
        revenueGenerated: 0,
      },
      rating: { average: Math.round((3.5 + Math.random() * 1.5) * 10) / 10, count: randomInt(3, 60) },
    });
    agentUsers.push(user);
  }

  const demoAgent = await User.create({
    name: 'Simran Kaur',
    email: 'agent@horizonrealty.in',
    password: 'Agent@123',
    role: ROLES.AGENT,
    company: company._id,
    phone: '+91-9876599999',
    specialization: 'Residential',
    isEmailVerified: true,
  });
  await Agent.create({
    user: demoAgent._id,
    company: company._id,
    specialization: ['Residential', 'Luxury'],
    experienceYears: 6,
    territories: ['Chandigarh', 'Mohali'],
    rating: { average: 4.7, count: 42 },
  });
  agentUsers.push(demoAgent);

  console.log('  Creating 12 developers...');
  const developers = [];
  for (const name of DEVELOPER_NAMES) {
    const dev = await Developer.create({
      company: company._id,
      name,
      description: `${name} is a trusted real estate developer known for quality construction and timely delivery across North India.`,
      establishedYear: randomInt(1985, 2015),
      headquarters: randomCity(),
      totalProjects: randomInt(3, 25),
      isVerified: true,
    });
    developers.push(dev);
  }

  console.log('  Creating projects, buildings, and units...');
  const projects = [];
  for (let i = 0; i < 14; i++) {
    const city = randomCity();
    const dev = randomFrom(developers);
    const project = await Project.create({
      company: company._id,
      developer: dev._id,
      name: `${randomFrom(['Emerald', 'Palm', 'Crystal', 'Silver', 'Golden', 'Royal', 'Elite', 'Grand'])} ${randomFrom(['Heights', 'Residency', 'Enclave', 'Meadows', 'Greens', 'Towers'])}`,
      description: `A premium residential project offering modern amenities in ${randomLocality(city)}, ${city}.`,
      location: {
        city,
        locality: randomLocality(city),
        state: 'India',
        geo: { coordinates: [77 + Math.random() * 10, 20 + Math.random() * 10] },
      },
      amenities: randomSubset(AMENITIES, 6, 12),
      constructionStatus: randomFrom(['PRE_LAUNCH', 'UNDER_CONSTRUCTION', 'READY_TO_MOVE', 'COMPLETED']),
      completionDate: new Date(Date.now() + randomInt(-365, 730) * 24 * 60 * 60 * 1000),
      priceRange: { min: randomInt(3500000, 6000000), max: randomInt(8000000, 25000000) },
      images: makeImages(3),
      isPublished: true,
    });

    let totalUnits = 0;
    for (let b = 0; b < randomInt(1, 3); b++) {
      const totalFloors = randomInt(8, 25);
      const building = await Building.create({
        company: company._id,
        project: project._id,
        name: `Tower ${String.fromCharCode(65 + b)}`,
        totalFloors,
        unitsPerFloor: 4,
      });

      const unitsToInsert = [];
      for (let floor = 1; floor <= totalFloors; floor++) {
        for (let u = 1; u <= 4; u++) {
          unitsToInsert.push({
            company: company._id,
            project: project._id,
            building: building._id,
            unitNumber: `${building.name.slice(-1)}-${floor}0${u}`,
            floor,
            bedrooms: randomFrom([2, 3, 3, 4]),
            bathrooms: randomFrom([2, 2, 3]),
            area: { value: randomInt(950, 2400), unit: 'SQFT' },
            facing: randomFrom(['North', 'South', 'East', 'West', 'North-East', 'South-West']),
            price: randomInt(3800000, 22000000),
            status: randomFrom(['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'RESERVED', 'SOLD']),
          });
        }
      }
      await Unit.insertMany(unitsToInsert);
      totalUnits += unitsToInsert.length;
      await Building.updateOne({ _id: building._id }, { totalUnits: unitsToInsert.length });
    }

    const availableCount = await Unit.countDocuments({ project: project._id, status: 'AVAILABLE' });
    project.totalUnits = totalUnits;
    project.availableUnits = availableCount;
    await project.save();

    projects.push(project);
  }

  console.log('  Creating 110 properties...');
  const properties = [];
  for (let i = 0; i < 110; i++) {
    const city = randomCity();
    const locality = randomLocality(city);
    const propertyType = randomFrom(PROPERTY_TYPES);
    const isPlot = propertyType === 'PLOT';
    const bedrooms = isPlot ? 0 : randomFrom([1, 2, 2, 3, 3, 3, 4, 5]);
    const price = isPlot ? randomInt(1500000, 8000000) : randomInt(2500000, 35000000);
    const listingType = Math.random() > 0.75 ? 'RENT' : 'SALE';
    const agent = randomFrom(agentUsers);
    const useProject = Math.random() > 0.5 && !isPlot;
    const project = useProject ? randomFrom(projects) : null;

    const property = await Property.create({
      company: company._id,
      title: `${randomFrom(['Spacious', 'Elegant', 'Modern', 'Luxurious', 'Cozy', 'Premium'])} ${bedrooms ? bedrooms + 'BHK ' : ''}${propertyType.replace('_', ' ').toLowerCase()} in ${locality}`,
      description: `This ${propertyType.replace('_', ' ').toLowerCase()} in ${locality}, ${city} offers a comfortable and modern living experience with excellent connectivity to schools, hospitals, and markets. Thoughtfully designed with quality fittings throughout.`,
      listingType,
      propertyType,
      status: Math.random() > 0.08 ? 'PUBLISHED' : 'DRAFT',
      price,
      priceNegotiable: Math.random() > 0.5,
      maintenanceCharge: isPlot ? 0 : randomInt(1500, 8000),
      location: {
        address: `${randomInt(1, 999)}, ${locality}`,
        city,
        locality,
        state: 'India',
        pincode: String(randomInt(110000, 800000)),
        geo: { coordinates: [76 + Math.random() * 8, 20 + Math.random() * 10] },
      },
      bedrooms,
      bathrooms: isPlot ? 0 : Math.max(1, bedrooms - randomInt(0, 1)),
      balconies: isPlot ? 0 : randomInt(0, 3),
      area: { value: isPlot ? randomInt(1000, 4500) : randomInt(600, 3200), unit: 'SQFT' },
      floor: isPlot ? undefined : randomInt(0, 20),
      totalFloors: isPlot ? undefined : randomInt(4, 25),
      furnishing: isPlot ? 'UNFURNISHED' : randomFrom(FURNISHING_TYPES),
      ageOfProperty: randomInt(0, 15),
      amenities: randomSubset(AMENITIES, 4, 10),
      images: makeImages(randomInt(4, 7)),
      developer: project ? project.developer : null,
      project: project ? project._id : null,
      agent: agent._id,
      investment: {
        expectedRentalYield: Math.round((2 + Math.random() * 4) * 100) / 100,
        expectedAppreciation: Math.round((5 + Math.random() * 6) * 100) / 100,
        monthlyRent: listingType === 'RENT' ? price : Math.round((price * 0.003) / 100) * 100,
      },
      viewsCount: randomInt(10, 2000),
      isFeatured: Math.random() > 0.85,
      publishedAt: new Date(Date.now() - randomInt(0, 180) * 24 * 60 * 60 * 1000),
    });
    properties.push(property);
  }

  console.log('  Creating 55 customers...');
  const customerUsers = [];
  for (let i = 0; i < 55; i++) {
    const user = await User.create({
      name: randomName(),
      email: `customer${i + 1}@example.com`,
      password: 'Customer@123',
      role: ROLES.CUSTOMER,
      phone: `+91-98${String(randomInt(1000000, 9999999))}`,
      isEmailVerified: true,
    });
    await Customer.create({
      user: user._id,
      primaryCompany: company._id,
      preferences: {
        budgetMin: randomInt(2000000, 5000000),
        budgetMax: randomInt(6000000, 20000000),
        preferredCities: randomSubset(Object.keys(CITIES), 1, 2),
        propertyTypes: randomSubset(PROPERTY_TYPES, 1, 3),
        bedrooms: randomFrom([1, 2, 3, 4]),
      },
    });
    customerUsers.push(user);
  }

  const demoCustomer = await User.create({
    name: 'Arjun Mehta',
    email: 'customer@example.com',
    password: 'Customer@123',
    role: ROLES.CUSTOMER,
    phone: '+91-9876511111',
    isEmailVerified: true,
  });
  await Customer.create({ user: demoCustomer._id, primaryCompany: company._id });
  customerUsers.push(demoCustomer);

  console.log('  Creating 210 leads...');
  const leads = [];
  for (let i = 0; i < 210; i++) {
    const status = randomFrom(LEAD_STATUS_ORDER);
    const agent = randomFrom(agentUsers);
    const linkedCustomer = Math.random() > 0.4 ? randomFrom(customerUsers) : null;
    const interested = randomSubset(properties, 0, 3).map((p) => p._id);

    const lead = await Lead.create({
      company: company._id,
      name: linkedCustomer ? linkedCustomer.name : randomName(),
      email: linkedCustomer ? linkedCustomer.email : `lead${i + 1}@example.com`,
      phone: `+91-97${String(randomInt(10000000, 99999999))}`,
      source: randomFrom(Object.values(LEAD_SOURCE)),
      budgetMin: randomInt(2000000, 5000000),
      budgetMax: randomInt(6000000, 25000000),
      preferredLocation: randomSubset(Object.keys(CITIES), 1, 2),
      propertyType: randomSubset(PROPERTY_TYPES, 1, 2),
      interestedProperties: interested,
      assignedAgent: agent._id,
      linkedCustomer: linkedCustomer ? linkedCustomer._id : null,
      status,
      score: randomInt(10, 95),
      followUpDate:
        status !== 'CLOSED' && status !== 'LOST'
          ? new Date(Date.now() + randomInt(-5, 20) * 24 * 60 * 60 * 1000)
          : null,
      notes:
        Math.random() > 0.5
          ? [
              {
                text: randomFrom([
                  'Called and discussed budget.',
                  'Very interested, wants to visit soon.',
                  'Following up next week.',
                  'Sent property brochure via email.',
                ]),
                createdBy: agent._id,
              },
            ]
          : [],
    });
    leads.push(lead);
  }

  console.log('  Creating appointments...');
  const appointments = [];
  for (let i = 0; i < 90; i++) {
    const property = randomFrom(properties);
    const customer = randomFrom(customerUsers);
    const isPast = Math.random() > 0.5;
    const status = isPast ? randomFrom(['COMPLETED', 'COMPLETED', 'CANCELLED']) : randomFrom(['REQUESTED', 'CONFIRMED']);

    const appt = await Appointment.create({
      company: company._id,
      property: property._id,
      customer: customer._id,
      agent: property.agent,
      scheduledDate: new Date(Date.now() + (isPast ? -1 : 1) * randomInt(1, 20) * 24 * 60 * 60 * 1000),
      scheduledTime: `${String(randomInt(9, 18)).padStart(2, '0')}:${randomFrom(['00', '30'])}`,
      status,
      completedAt: status === 'COMPLETED' ? new Date() : undefined,
    });
    appointments.push(appt);
  }

  console.log('  Creating deals...');
  const closedLeads = leads.filter((l) => l.status === 'CLOSED').slice(0, 45);
  for (const lead of closedLeads) {
    const property = randomFrom(properties);
    const stage = randomFrom(['WON', 'WON', 'OPEN', 'LOST']);
    const dealValue = property.price;
    const commissionPercent = 2;
    await Deal.create({
      company: company._id,
      lead: lead._id,
      property: property._id,
      customer: lead.linkedCustomer || randomFrom(customerUsers)._id,
      agent: lead.assignedAgent,
      dealValue,
      commissionPercent,
      commissionAmount: Math.round((dealValue * commissionPercent) / 100),
      stage,
      closedAt: stage === 'WON' ? new Date() : undefined,
      lostReason: stage === 'LOST' ? 'Customer chose a different property.' : undefined,
    });

    if (stage === 'WON') {
      await Agent.updateOne(
        { user: lead.assignedAgent },
        { $inc: { 'stats.dealsClosed': 1, 'stats.revenueGenerated': Math.round((dealValue * commissionPercent) / 100) } }
      );
    }
  }

  console.log('  Creating sample conversations...');
  for (let i = 0; i < 15; i++) {
    const customer = randomFrom(customerUsers);
    const agent = randomFrom(agentUsers);
    const property = randomFrom(properties);

    const convo = await Conversation.create({
      company: company._id,
      participants: [customer._id, agent._id],
      property: property._id,
      lastMessage: { text: 'Is this property still available?', sender: customer._id, sentAt: new Date() },
    });

    await Message.create({
      conversation: convo._id,
      sender: customer._id,
      text: `Hi, I'm interested in "${property.title}". Is it still available?`,
      readBy: [customer._id],
    });
    await Message.create({
      conversation: convo._id,
      sender: agent._id,
      text: 'Yes, it is! Would you like to schedule a visit this week?',
      readBy: [agent._id],
    });
  }

  console.log('  Creating sample notifications...');
  await Notification.insertMany([
    {
      company: company._id,
      recipient: demoAgent._id,
      type: 'NEW_LEAD',
      title: 'New lead assigned',
      message: 'A new lead has been assigned to you.',
      isRead: false,
    },
    {
      company: company._id,
      recipient: demoCustomer._id,
      type: 'APPOINTMENT_CONFIRMED',
      title: 'Visit confirmed',
      message: 'Your property visit has been confirmed by the agent.',
      isRead: false,
    },
  ]);

  console.log('\n  Seed complete!\n');
  console.log('  ── Demo accounts ──────────────────────────────');
  console.log('  Super Admin    : superadmin@propflow.app / SuperAdmin@123');
  console.log('  Company Admin  : admin@horizonrealty.in  / Admin@123');
  console.log('  Agent          : agent@horizonrealty.in  / Agent@123');
  console.log('  Customer       : customer@example.com    / Customer@123');
  console.log('  ────────────────────────────────────────────────\n');
  console.log(
    `  Seeded: ${properties.length} properties, ${agentUsers.length} agents, ${leads.length} leads, ${customerUsers.length} customers, ${developers.length} developers, ${projects.length} projects, ${appointments.length} appointments.\n`
  );

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
