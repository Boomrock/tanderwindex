import { sqliteDb } from './db-simple';

async function createTestBidData() {
  try {
    console.log('Creating test data for bid approval system...');

    // Create a test bid directly in SQL
    const insertBidSql = `
      INSERT INTO tender_bids (
        tender_id, user_id, amount, description, timeframe, documents, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const bidResult = sqliteDb.prepare(insertBidSql).run(
      3, // tender_id (the test tender we created)
      1, // user_id (specialist)
      7500000, // amount
      'Здравствуйте! Я готов взяться за строительство вашего дома. Имею 8 лет опыта в загородном строительстве, все необходимые лицензии и сертификаты. В портфолио более 30 успешно завершенных проектов. Предлагаю использовать качественные материалы и современные технологии. Гарантия на все работы 3 года.', // description
      120, // timeframe
      '["license.pdf", "portfolio.pdf", "certificates.pdf"]', // documents
      'pending', // status
      new Date().toISOString(), // created_at
      new Date().toISOString()  // updated_at
    );

    console.log('Test bid created with ID:', bidResult.lastInsertRowid);

    // Create notification for tender owner
    const insertNotificationSql = `
      INSERT INTO notifications (
        user_id, title, message, type, related_id, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const notificationResult = sqliteDb.prepare(insertNotificationSql).run(
      17, // user_id (admin - tender owner)
      'Новая заявка на тендер', // title
      'Получена новая заявка на тендер "Строительство загородного дома" от специалиста', // message
      'tender_bid', // type
      3, // related_id (tender_id)
      0, // is_read (false)
      new Date().toISOString() // created_at
    );

    console.log('Test notification created with ID:', notificationResult.lastInsertRowid);

    // Also create a chat between the customer and contractor
    const insertMessageSql = `
      INSERT INTO messages (
        sender_id, receiver_id, content, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const messageResult = sqliteDb.prepare(insertMessageSql).run(
      1, // sender_id (specialist)
      17, // receiver_id (admin - tender owner)
      'Здравствуйте! Я подал заявку на ваш тендер по строительству загородного дома. Готов обсудить детали проекта и ответить на любые вопросы.', // content
      0, // is_read (false)
      new Date().toISOString() // created_at
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