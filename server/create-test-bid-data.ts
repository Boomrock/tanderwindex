import { sqliteDb } from './db-simple';

async function createTestBidData() {
  try {
    console.log('Creating test data for bid approval system...');

    // Create a test bid directly in SQL
    const insertBidSql = `
      INSERT INTO tender_bids (
        tenderId, userId, amount, description, timeframe, documents, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const bidResult = sqliteDb.prepare(insertBidSql).run(
      3, // tenderId (the test tender we created)
      1, // userId (specialist)
      7500000, // amount
      'Здравствуйте! Я готов взяться за строительство вашего дома. Имею 8 лет опыта в загородном строительстве, все необходимые лицензии и сертификаты. В портфолио более 30 успешно завершенных проектов. Предлагаю использовать качественные материалы и современные технологии. Гарантия на все работы 3 года.', // description
      120, // timeframe
      '["license.pdf", "portfolio.pdf", "certificates.pdf"]', // documents
      'pending', // status
      new Date().toISOString() // createdAt
    );

    console.log('Test bid created with ID:', bidResult.lastInsertRowid);

    // Create notification for tender owner
    const insertNotificationSql = `
      INSERT INTO notifications (
        userId, title, message, type, related_id, is_read, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const notificationResult = sqliteDb.prepare(insertNotificationSql).run(
      17, // userId (admin - tender owner)
      'Новая заявка на тендер', // title
      'Получена новая заявка на тендер "Строительство загородного дома" от специалиста', // message
      'tender_bid', // type
      3, // related_id (tender_id)
      0, // is_read (false)
      new Date().toISOString() // createdAt
    );

    console.log('Test notification created with ID:', notificationResult.lastInsertRowid);

    // Also create a chat between the customer and contractor
    const insertMessageSql = `
      INSERT INTO messages (
        senderId, receiverId, content, isRead, createdAt
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const messageResult = sqliteDb.prepare(insertMessageSql).run(
      1, // senderId (specialist)
      17, // receiverId (admin - tender owner)
      'Здравствуйте! Я подал заявку на ваш тендер по строительству загородного дома. Готов обсудить детали проекта и ответить на любые вопросы.', // content
      0, // isRead (false)
      new Date().toISOString() // createdAt
    );

    console.log('Test message created with ID:', messageResult.lastInsertRowid);

    console.log('✅ Test data for bid approval system created successfully!');
    console.log('You can now test the system:');
    console.log('1. Login as admin (admin/admin123)');
    console.log('2. Go to tender details for "Строительство загородного дома"');
    console.log('3. View pending bid applications in the new "Заявки" tab');
    console.log('4. Test approve/reject functionality');
    console.log('5. Check notifications for status updates');

  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

// Run the test data creation
createTestBidData();