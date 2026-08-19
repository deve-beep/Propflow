const CITIES = {
  Chandigarh: ['Sector 17', 'Sector 22', 'Sector 35', 'Sector 43', 'Manimajra'],
  Mohali: ['Phase 1', 'Phase 3B2', 'Phase 7', 'Sector 70', 'Kharar Road'],
  Delhi: ['Dwarka', 'Rohini', 'Saket', 'Vasant Kunj', 'Karol Bagh'],
  Gurgaon: ['DLF Phase 1', 'Sohna Road', 'Sector 49', 'Golf Course Road', 'MG Road'],
  Noida: ['Sector 62', 'Sector 137', 'Sector 150', 'Greater Noida West', 'Sector 50'],
  Lucknow: ['Gomti Nagar', 'Hazratganj', 'Alambagh', 'Indira Nagar', 'Aliganj'],
  Kanpur: ['Swaroop Nagar', 'Kakadeo', 'Civil Lines', 'Kalyanpur', 'Panki'],
  Jaipur: ['Malviya Nagar', 'Vaishali Nagar', 'C-Scheme', 'Mansarovar', 'Jagatpura'],
  Bangalore: ['Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Electronic City'],
  Mumbai: ['Andheri West', 'Powai', 'Bandra', 'Thane', 'Malad'],
};

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Reyansh', 'Krishna', 'Ishaan', 'Kabir', 'Rohan',
  'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kiara', 'Myra', 'Anika', 'Navya', 'Riya', 'Ishita',
  'Rahul', 'Amit', 'Vikram', 'Sanjay', 'Rajesh', 'Deepak', 'Manish', 'Suresh', 'Ashok', 'Ramesh',
  'Priya', 'Neha', 'Pooja', 'Kavita', 'Sunita', 'Anita', 'Meena', 'Rekha', 'Sarita', 'Geeta',
  'Harpreet', 'Gurpreet', 'Jasleen', 'Simran', 'Manpreet', 'Jaspreet',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Reddy', 'Rao', 'Mehta', 'Chopra',
  'Malhotra', 'Kapoor', 'Khanna', 'Bansal', 'Aggarwal', 'Jain', 'Saxena', 'Mishra', 'Tiwari', 'Yadav',
  'Grewal', 'Sidhu', 'Bajwa', 'Sandhu', 'Bhatia', 'Chawla', 'Arora', 'Sethi', 'Goyal', 'Khurana',
];

const AMENITIES = [
  'Swimming Pool', 'Gymnasium', 'Clubhouse', '24x7 Security', 'Power Backup', 'Covered Parking',
  'Children Play Area', 'Landscaped Gardens', 'Rainwater Harvesting', 'CCTV Surveillance',
  'Intercom Facility', 'Lift', 'Fire Safety', 'Jogging Track', 'Indoor Games Room', 'Amphitheatre',
  'Yoga Deck', 'Senior Citizen Sit-out', 'Multipurpose Hall', 'EV Charging Point',
];

const DEVELOPER_NAMES = [
  'Shalimar Group', 'Emaar India', 'Sobha Developers', 'DLF Homes', 'Godrej Properties',
  'Omaxe Ltd', 'TDI Infrastructure', 'GBP Group', 'Gillco Developers', 'Wave Estate',
  'Ansal Housing', 'Puri Constructions',
];

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomSubset = (arr, min, max) => {
  const count = randomInt(min, max);
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const randomName = () => `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;
const randomCity = () => randomFrom(Object.keys(CITIES));
const randomLocality = (city) => randomFrom(CITIES[city]);

module.exports = {
  CITIES,
  FIRST_NAMES,
  LAST_NAMES,
  AMENITIES,
  DEVELOPER_NAMES,
  randomFrom,
  randomInt,
  randomSubset,
  randomName,
  randomCity,
  randomLocality,
};
