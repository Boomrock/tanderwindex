import { simpleSqliteStorage } from './sqlite-storage-simple';
import { db, initializeDatabase, addModerationFields, addBidStatusFields } from './db-simple';

async function createTestTenderAndBid() {
  try {
    console.log('Initializing database for test data...');
    
    // Initialize database with all required tables
    await initializeDatabase();
    await addModerationFields();
    await addBidStatusFields();
    
    console.log('Creating test tender and bid for the new approval system...');

    // Create a test tender
    const tender = await simpleSqliteStorage.createTender({
      title: 'Строительство загородного дома',
      description: 'Требуется построить двухэтажный загородный дом площадью 200 кв.м. Участок подготовлен, есть все коммуникации. Нужен опытный подрядчик с хорошими отзывами.',
      budget: 8000000,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
      location: 'Московская область, Одинцовский район',
      category: 'construction',
      userId: 17, // admin user
      requirements: 'Опыт работы от 5 лет, наличие лицензии, портфолио выполненных работ',
      contactInfo: 'Телефон: +7 (999) 123-45-67, Email: customer@example.com',
      status: 'open'
    });

    console.log('Test tender created:', tender);

    // Create a test specialist user for bidding
    const specialist = await simpleSqliteStorage.createUser({
      username: 'specialist_builder',
      email: 'builder@example.com',
      password: '$2b$10$example_hash', // This is just for testing
      fullName: 'Иван Строитель',
      userType: 'contractor',
      isVerified: true,
      rating: 4.8,
      completedProjects: 25,
      phoneNumber: '+7 (999) 555-77-88',
      location: 'Москва'
    });

    console.log('Test specialist created:', specialist);

    // Create a test bid with pending status
    const bid = await simpleSqliteStorage.createTenderBid({
      tenderId: tender.id,
      userId: specialist.id,
      amount: 7500000,
      description: 'Здравствуйте! Я готов взяться за строительство вашего дома. Имею 8 лет опыта в загородном строительстве, все необходимые лицензии и сертификаты. В портфолио более 30 успешно завершенных проектов. Предлагаю использовать качественные материалы и современные технологии. Гарантия на все работы 3 года.',
      timeframe: 120, // 120 days
      documents: ['license.pdf', 'portfolio.pdf', 'certificates.pdf'],
      status: 'pending'
    });

    console.log('Test bid created:', bid);

    // Create notification for tender owner
    await simpleSqliteStorage.createNotification({
      userId: 17, // admin user (tender owner)
      title: 'Новая заявка на тендер',
      message: `Получена новая заявка на тендер "${tender.title}" от пользователя ${specialist.fullName}`,
      type: 'tender_bid',
      relatedId: tender.id,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    console.log('Test notification created');
    console.log('Test data setup complete! You can now test the bid approval system.');

  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

// Run the test data creation
createTestTenderAndBid();