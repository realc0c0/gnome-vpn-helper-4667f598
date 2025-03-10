
// Telegram bot server
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');

// Initialize with environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminId = process.env.ADMIN_USER_ID;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if required environment variables are set
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required!');
  process.exit(1);
}

if (!adminId) {
  console.error('ADMIN_USER_ID is required!');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required!');
  process.exit(1);
}

// Initialize bot and Supabase connection
const bot = new TelegramBot(token, { polling: true });
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'user-id': 'telegram-bot'
    }
  }
});

// VPN Clients and Plans configuration
const vpnClients = {
  android: 'https://apps.irancdn.org/android/connectix-2.3.3-v8a.apk',
  windows: 'https://apps.irancdn.org/windows/Connectix-2.3.2.zip',
  mac: 'https://apps.irancdn.org/mac/Connectix-2.3.2.zip'
};

// Command handlers
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `🌟 به Mr.Gnome VPN Bot خوش آمدید! 🌟 

ما خدمات VPN با کیفیت بالا را با:
• اتصالات سریع و قابل اعتماد
• پشتیبانی از چند دستگاه
• مرور امن و خصوصی
• پشتیبانی 24 ساعته مشتری 📞

برای مشاهده بسته های موجود ما از /plans استفاده کنید.
از /clients برای دانلود کلاینت های VPN برای دستگاه های خود استفاده کنید.`;

  await bot.sendMessage(chatId, welcomeMessage, {
    reply_markup: {
      keyboard: [
        ['📦 View Plans'],
        ['📱 Download Clients', '💳 Payment Status'],
        ['📱 Support', '❓ FAQ']
      ],
      resize_keyboard: true
    }
  });
});

// Handle "View Plans" button or /plans command
bot.onText(/\/plans|📦 View Plans/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    // Fetch VPN plans from Supabase
    const { data: vpnPlans, error } = await supabase
      .from('vpn_plans')
      .select('*');
      
    if (error) throw error;
    
    if (!vpnPlans || vpnPlans.length === 0) {
      await bot.sendMessage(chatId, '⚠️ No plans found. Please try again later.');
      return;
    }
    
    // Create inline keyboard with plans
    const inlineKeyboard = vpnPlans.map(plan => ([{
      text: `${plan.name} - ${plan.price / 1000}T`,
      callback_data: `plan_${plan.id}`
    }]));
    
    await bot.sendMessage(chatId, '🌟 طرح VPN خود را انتخاب کنید:', {
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    await bot.sendMessage(chatId, '❌ خطا در دریافت طرح‌ها. لطفاً بعداً دوباره امتحان کنید.');
  }
});

// Handle VPN clients command
bot.onText(/\/clients|📱 Download Clients/, async (msg) => {
  const chatId = msg.chat.id;
  const clientMessage = `📱 دانلودهای مشتری VPN

مشتری VPN ما را برای دستگاه خود بارگیری کنید:

🤖 اندروید: ${vpnClients.android}
💻 ویندوز: ${vpnClients.windows}
🍏 macOS: ${vpnClients.mac}

⚠️ مهم: قبل از استفاده از سرویس VPN مطمئن شوید که کلاینت صحیح دستگاه خود را دانلود و نصب کنید. به کمک نیاز دارید؟ با تیم پشتیبانی ما تماس بگیرید!`;

  await bot.sendMessage(chatId, clientMessage);
});

// Handle plan selection
bot.on('callback_query', async (query) => {
  if (!query.message || !query.data) return;
  const chatId = query.message.chat.id;

  // Handle order completion confirmation
  if (query.data.startsWith('complete_order_')) {
    if (query.from.id.toString() !== adminId) {
      await bot.answerCallbackQuery(query.id, { text: '⚠️ Only admin can complete orders!' });
      return;
    }
    const [, userId, orderId] = query.data.split('_');
    try {
      // Update order status in database
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (error) throw error;

      await Promise.all([
        bot.editMessageText('✅سفارش به عنوان تکمیل شده علامت گذاری شد! اکنون می توانید اعتبار VPN را برای کاربر ارسال کنید.', {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id
        }),
        bot.sendMessage(userId, `✅ سفارش شما تکمیل شد لطفا صبر کنید تا مدیر اعتبار VPN شما را برای شما ارسال کندs.`)
      ]);
    } catch (error) {
      console.error('Error completing order:', error);
      await bot.answerCallbackQuery(query.id, {
        text: '❌ Error updating order status. Please try again.',
        show_alert: true
      });
    }
    return;
  }

  // Handle regular plan selection
  const planId = query.data.replace('plan_', '');
  
  try {
    // Get the selected plan from database
    const { data: plan, error } = await supabase
      .from('vpn_plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (error) throw error;
    
    if (!plan) {
      await bot.answerCallbackQuery(query.id, { 
        text: '❌ Plan not found. Please try again.', 
        show_alert: true 
      });
      return;
    }

    const orderMessage = `
📦 Order Details:
Plan: ${plan.name}
${plan.details}
Price: ${plan.price / 1000}T

لطفاً عکس از رسید پرداخت خود (فقط بانک، برای تماس با پشتیبانی تماس بگیرید @firstgnome) ارسال کنید.

شماره کارت جهت واریز:
5859831207627083

تجارت بانک

پس از تأیید پرداخت شما، اعتبار VPN خود را دریافت خواهید کرد.
⚠️ مهم: مطمئن شوید که مشتری VPN را برای دستگاه(های) خود با استفاده از دستور /clients دانلود کرده اید.
`;

    // Store order in database
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: chatId.toString(),
        plan_id: planId,
        status: 'pending',
        amount: plan.price
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    const adminMessage = `
🔔 New Order Alert!
User ID: ${chatId}
Plan: ${plan.name}
Amount: ${plan.price / 1000}T
Status: Pending Payment
`;

    await Promise.all([
      bot.answerCallbackQuery(query.id),
      bot.sendMessage(adminId, adminMessage),
      bot.sendMessage(chatId, orderMessage)
    ]);
  } catch (error) {
    console.error('Error processing order:', error);
    await bot.answerCallbackQuery(query.id, { 
      text: '❌ Error processing your order. Please try again.', 
      show_alert: true 
    });
    await bot.sendMessage(chatId, 'Sorry, there was an error processing your order. Please try again later.');
    await bot.sendMessage(adminId, `⚠️ Error processing order from user ${chatId}:\n${error.message}`);
  }
});

// Handle payment confirmation images
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const photo = msg.photo[msg.photo.length - 1]; // Get the highest resolution photo
  try {
    // Get the latest pending order for this user
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', chatId.toString())
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (orderError) throw orderError;

    await Promise.all([
      bot.forwardMessage(adminId, chatId, msg.message_id),
      bot.sendMessage(adminId, `💳 Payment Confirmation Received\nFrom User: ${chatId}\nOrder Details: ID: ${orderData.id} Plan: ${orderData.plan_id} Amount: ${orderData.amount / 1000}T`, {
        reply_markup: {
          inline_keyboard: [[{
            text: '✅ Complete Order',
            callback_data: `complete_order_${chatId}_${orderData.id}`
          }]]
        }
      })
    ]);

    await bot.sendMessage(chatId, `✅ ممنون تایید پرداخت شما دریافت شده و در حال بررسی است.`);
  } catch (error) {
    console.error('Error handling payment confirmation:', error);
    await bot.sendMessage(chatId, 'Sorry, there was an error processing your payment confirmation. Please try again or contact support.');
  }
});

// Support command
bot.onText(/📱 Support/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, `Need help? Contact our support:\n📧 Email: bodapoor5@gmail.com\n💬 Telegram: @firstgnome`);
});

// FAQ command
bot.onText(/❓ FAQ/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, `❓ سوالات متداول\n
سؤال: چگونه به VPN متصل شوم؟ 
پاسخ: 1. مشتری VPN مناسب را برای دستگاه خود دانلود کنید (دستور کلاینت/) 
2. کلاینت را نصب کنید 
3. اعتبارنامه هایی را که پس از تأیید پرداخت ارسال خواهیم کرد را وارد کنید. 
4. متصل شوید و از مرور ایمن لذت ببرید!`);
});

// For Vercel serverless functions - export a function handler
module.exports = async (req, res) => {
  // For webhook mode if needed in the future
  // This endpoint would receive updates from Telegram
  res.status(200).send('Bot is running');
};

// Start bot with polling
console.log('Bot is running...');
