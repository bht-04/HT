const fetch = require("node-fetch");
const Chat = require("../../models/chatbot.models.js");
const Product = require("../../models/productModel.js");

function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Làm sạch văn bản: xóa khoảng trắng thừa
 */
function cleanText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Viết hoa chữ cái đầu
 */
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==================== CATEGORY DETECTION (SIÊU NÂNG CẤP) ====================
const CATEGORIES = [
  { 
    name: "tai nghe", 
    keywords: ["tai nghe", "headphone", "earphone", "headset", "bluetooth", "wireless", "chống ồn", "noise cancelling", "airpod", "galaxy bud", "sony", "jbl"],
    synonyms: ["nghe nhạc", "âm thanh cá nhân", "thiết bị đeo tai"]
  },
  { 
    name: "đồng hồ", 
    keywords: ["đồng hồ", "watch", "smartwatch", "đeo tay", "apple watch", "samsung watch", "garmin", "fitbit"],
    synonyms: ["đồng hồ thông minh", "thiết bị đeo tay", "theo dõi sức khỏe"]
  },
  { 
    name: "điện thoại", 
    keywords: ["điện thoại", "smartphone", "iphone", "samsung", "xiaomi", "oppo", "vivo", "realme", "oneplus", "nokia", "sony", "google pixel"],
    synonyms: ["di động", "dế", "đt", "mobile", "smart phone"]
  },
  { 
    name: "màn hình", 
    keywords: ["màn hình", "monitor", "display", "màn hình máy tính", "4k", "curved", "cong", "gaming monitor", "dell", "lg", "samsung"],
    synonyms: ["màn hình máy tính", "màn hình gaming", "màn hình cong"]
  },
  { 
    name: "laptop", 
    keywords: ["laptop", "macbook", "notebook", "máy tính xách tay", "gaming", "ultrabook", "dell", "hp", "lenovo", "asus", "acer", "msi"],
    synonyms: ["máy tính", "pc xách tay", "laptop gaming"]
  },
  { 
    name: "loa", 
    keywords: ["loa", "speaker", "soundbar", "âm thanh", "bluetooth speaker", "loa kéo", "loa bluetooth", "jbl", "sony", "bose"],
    synonyms: ["loa bluetooth", "loa di động", "loa karaoke"]
  },
  { 
    name: "chuột", 
    keywords: ["chuột", "mouse", "gaming", "chuột máy tính", "wireless mouse", "logitech", "razer", "steelseries"],
    synonyms: ["chuột không dây", "chuột gaming", "mouse"]
  },
  { 
    name: "bàn phím", 
    keywords: ["bàn phím", "keyboard", "bàn phím cơ", "mechanical", "wireless keyboard", "cơ học", "logitech", "razer", "corsair"],
    synonyms: ["keyboard", "bàn phím cơ học", "bàn phím gaming"]
  },
  { 
    name: "máy in", 
    keywords: ["máy in", "printer", "in ấn", "multifunction", "laser", "inkjet", "brother", "hp", "canon", "epson"],
    synonyms: ["in", "máy photocopy", "máy in laser"]
  },
  { 
    name: "camera", 
    keywords: ["camera", "webcam", "quay phim", "action cam", "gopro", "an ninh", "canon", "nikon", "sony"],
    synonyms: ["camera quay phim", "máy ảnh", "camera an ninh"]
  },
  { 
    name: "tivi", 
    keywords: ["tivi", "tv", "smart tv", "television", "oled", "qled", "lg", "samsung tv", "sony", "tcl"],
    synonyms: ["màn hình tivi", "tv thông minh", "tivi oled"]
  },
  { 
    name: "phụ kiện", 
    keywords: ["phụ kiện", "accessories", "sạc", "cáp", "ốp lưng", "cường lực", "bao da", "tai nghe", "loa", "chuột", "bàn phím"],
    synonyms: ["phụ kiện di động", "phụ kiện máy tính", "phụ kiện công nghệ"]
  },
];

/**
 * Phát hiện danh mục sản phẩm từ câu hỏi
 */
function detectCategory(question) {
  const q = question.toLowerCase();
  let bestMatch = null;
  let maxMatches = 0;

  for (const cat of CATEGORIES) {
    let matches = 0;
    const allKeywords = [...cat.keywords, ...(cat.synonyms || [])];

    for (const keyword of allKeywords) {
      if (q.includes(keyword)) {
        matches += keyword.split(' ').length;
      }
    }

    // Kiểm tra từ khóa riêng lẻ
    const words = q.split(/\s+/);
    for (const word of words) {
      if (word.length > 2 && cat.keywords.some(k => k.includes(word))) {
        matches += 1;
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = cat.name;
    }
  }

  return bestMatch;
}

// ==================== SMART PRODUCT SEARCH (SIÊU NÂNG CẤP) ====================
async function searchProducts(query, limit = 5) {
  const keywords = query.split(/\s+/).filter(w => w.length > 1);
  if (keywords.length === 0) return [];

  try {
    // Tìm kiếm với độ ưu tiên khác nhau
    const products = await Product.find({
      $or: [
        { productName: { $regex: keywords.join('|'), $options: 'i' } },
        { brandName: { $regex: keywords.join('|'), $options: 'i' } },
        { category: { $regex: keywords.join('|'), $options: 'i' } },
        { description: { $regex: keywords.join('|'), $options: 'i' } },
        { more_details: { $regex: keywords.join('|'), $options: 'i' } },
      ]
    })
    .limit(limit)
    .lean()
    .select('productName brandName category sellingPrice description more_details productImage productStock');
    const scoredProducts = products.map(p => {
      let score = 0;
      const text = `${p.productName} ${p.brandName} ${p.category} ${p.description || ''}`.toLowerCase();
      const nameLower = p.productName.toLowerCase();
      const brandLower = p.brandName.toLowerCase();
      const catLower = p.category.toLowerCase();

      for (const keyword of keywords) {
        const kw = keyword.toLowerCase();
        if (text.includes(kw)) score += 2;
        if (nameLower.includes(kw)) score += 10; // Ưu tiên tên sản phẩm
        if (brandLower.includes(kw)) score += 7; // Ưu tiên thương hiệu
        if (catLower.includes(kw)) score += 5; // Ưu tiên danh mục

        // Tìm kiếm từ khóa gần đúng
        for (const word of nameLower.split(' ')) {
          if (word.includes(kw) || kw.includes(word)) score += 3;
        }
      }

      // Ưu tiên sản phẩm còn hàng
      if (p.productStock && p.productStock > 0) score += 3;
      if (p.productStock && p.productStock > 10) score += 2;
      
      // Ưu tiên sản phẩm có giá hợp lý
      if (p.sellingPrice && p.sellingPrice > 0) score += 1;

      return { ...p, relevance: score };
    });

    return scoredProducts.sort((a, b) => b.relevance - a.relevance);
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

// ==================== AI CALL VỚI CƠ CHẾ RETRY THÔNG MINH ====================
async function callFreeAI(messages, maxTokens = 300) {
  const models = [
    "openai/gpt-oss-120b:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "microsoft/phi-3.5-mini-128k:free",
    "meta-llama/llama-3.2-3b-instruct:free"
  ];

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            max_tokens: maxTokens,
            temperature: 0.7,
            messages: messages,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content && content.length > 10) {
          console.log(`AI success with model: ${model}`);
          return cleanText(content);
        }
      }
    } catch (error) {
      console.log(`Model ${model} failed:`, error.message);
      continue;
    }
  }
  
  return null;
}

// ==================== GENERATE SIÊU THÔNG MINH (KHÔNG ICON) ====================
function generateUltraSmartResponse(question, products, category) {
  const q = question.toLowerCase();
  
  // ===== PHÂN TÍCH CÂU HỎI =====
  const questionType = analyzeQuestion(q);
  
  // ===== XỬ LÝ THEO LOẠI CÂU HỎI =====
  switch(questionType) {
    case 'greeting':
      return handleGreeting();
      
    case 'introduction':
      return handleIntroduction();
      
    case 'time':
      return handleTime();
      
    case 'stock':
      return handleStock(products);
      
    case 'compare':
      return handleCompare(products);
      
    case 'price':
      return handlePrice(products, category);
      
    case 'warranty':
      return handleWarranty();
      
    case 'shipping':
      return handleShipping();
      
    case 'payment':
      return handlePayment();
      
    case 'promotion':
      return handlePromotion();
      
    case 'service':
      return handleService();
      
    case 'product_features':
      return handleProductFeatures(products);
      
    case 'product_brand':
      return handleProductBrand(products);
      
    case 'product_general':
      return handleProductGeneral(products, category);
      
    case 'purchase':
      return handlePurchase();
      
    case 'advice':
      return handleAdvice();
      
    case 'thank':
      return handleThank();
      
    case 'complaint':
      return handleComplaint();
      
    case 'return_policy':
      return handleReturnPolicy();
      
    case 'installment':
      return handleInstallment();
      
    case 'authentic':
      return handleAuthentic();
      
    case 'technical':
      return handleTechnical(products);
      
    default:
      return handleGeneral(products, category);
  }
}
// ===== HÀM PHÂN TÍCH CÂU HỎI =====
function analyzeQuestion(q) {
  // Chào hỏi
  if (['chào', 'hello', 'hi', 'xin chào', 'hey', 'alo', 'chào bạn', 'xin chao'].some(w => q.includes(w)) && q.split(' ').length <= 4) {
    return 'greeting';
  }

  // Giới thiệu
  if (q.includes('bạn là ai') || q.includes('giới thiệu') || q.includes('về htshop') || q.includes('htshop là gì')) {
    return 'introduction';
  }

  // Thời gian
  if (q.includes('mấy giờ') || q.includes('giờ mở cửa') || q.includes('giờ làm việc') || q.includes('thời gian')) {
    return 'time';
  }

  // Tồn kho
  if (q.includes('còn hàng') || q.includes('còn không') || q.includes('có sẵn') || q.includes('stock') || q.includes('hết hàng')) {
    return 'stock';
  }

  // So sánh
  if (q.includes('so sánh') || q.includes('khác nhau') || q.includes('nào tốt hơn') || q.includes('nên chọn') || q.includes('phân biệt')) {
    return 'compare';
  }

  // Giá cả
  if (q.includes('giá') || q.includes('bao nhiêu') || q.includes('tiền') || q.includes('cost') || q.includes('rẻ') || q.includes('đắt') || q.includes('mắc') || q.includes('giá cả')) {
    return 'price';
  }
  // Bảo hành
  if (q.includes('bảo hành') || q.includes('đổi trả') || q.includes('chính sách') || q.includes('return')) {
    if (q.includes('đổi trả') || q.includes('return')) {
      return 'return_policy';
    }
    return 'warranty';
  }

  // Vận chuyển
  if (q.includes('vận chuyển') || q.includes('giao hàng') || q.includes('ship') || q.includes('delivery') || q.includes('nhận hàng') || q.includes('vận chuyển')) {
    return 'shipping';
  }

  // Thanh toán
  if (q.includes('thanh toán') || q.includes('trả tiền') || q.includes('payment') || q.includes('cách trả') || q.includes('trả góp')) {
    if (q.includes('trả góp')) {
      return 'installment';
    }
    return 'payment';
  }

  // Khuyến mãi
  if (q.includes('khuyến mãi') || q.includes('giảm giá') || q.includes('sale') || q.includes('ưu đãi') || q.includes('deal') || q.includes('khuyến mại')) {
    return 'promotion';
  }

  // Dịch vụ
  if (q.includes('dịch vụ') || q.includes('hỗ trợ') || q.includes('trợ giúp') || q.includes('giúp đỡ') || q.includes('service')) {
    return 'service';
  }

  // Tính năng sản phẩm
  if (q.includes('tính năng') || q.includes('thông số') || q.includes('cấu hình') || q.includes('spec') || q.includes('chức năng') || q.includes('thông tin')) {
    return 'product_features';
  }


  // Thương hiệu
  if (q.includes('thương hiệu') || q.includes('brand') || q.includes('hãng') || q.includes('sản xuất') || q.includes('nhà sản xuất')) {
    return 'product_brand';
  }


    if (containsKeyword(q, ['gì', 'đâu', 'cách'])) {
      return 'purchase';
    }
  // Mua hàng
  if (q.includes('mua') && !q.includes('gì') && !q.includes('đâu') && !q.includes('cách')) {
    return 'purchase';
  }

  // Tư vấn
  if (q.includes('tư vấn') || q.includes('advise') || q.includes('gợi ý') || q.includes('suggest')) {
    return 'advice';
  }


  // Cảm ơn
  if (q.includes('cảm ơn') || q.includes('thanks') || q.includes('thank') || q.includes('cám ơn')) {
    return 'thank';
  }


  // Khiếu nại
  if (q.includes('khiếu nại') || q.includes('phàn nàn') || q.includes('complain') || q.includes('không hài lòng')) {
    return 'complaint';
  }

  // Hàng chính hãng
  if (q.includes('chính hãng') || q.includes('authentic') || q.includes('hàng thật') || q.includes('thật không')) {
    return 'authentic';
  }

  // Kỹ thuật
  if (q.includes('lỗi') || q.includes('hỏng') || q.includes('sửa') || q.includes('cài đặt') || q.includes('setup') || q.includes('cài đặt')) {
    return 'technical';
  }

  // Sản phẩm cụ thể
  if (products && products.length > 0) {
    return 'product_general';
  }

  return 'general';
}

// ===== CÁC HÀM XỬ LÝ CÂU HỎI (KHÔNG ICON) =====
function handleGreeting() {
  const responses = [
    "Xin chào bạn! Rất vui được gặp bạn tại HTShop. Mình có thể giúp gì cho bạn hôm nay?",
    "Chào bạn! HTShop luôn sẵn sàng phục vụ bạn. Bạn cần tìm sản phẩm gì thế ạ?",
    "Xin chào! Cảm ơn bạn đã ghé thăm HTShop. Hôm nay mình có thể hỗ trợ bạn gì không?",
    "Chào mừng bạn đến với HTShop! Mình là trợ lý bán hàng, rất vui được hỗ trợ bạn."
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function handleIntroduction() {
  return "HTShop là hệ thống cửa hàng công nghệ uy tín hàng đầu tại Việt Nam, chuyên cung cấp các sản phẩm điện tử, công nghệ chính hãng với giá tốt nhất thị trường. Chúng mình có đầy đủ các dòng sản phẩm từ điện thoại thông minh, laptop, tai nghe, đồng hồ thông minh, phụ kiện công nghệ đến các thiết bị gia dụng thông minh. Với phương châm 'Khách hàng là trung tâm', HTShop cam kết mang đến trải nghiệm mua sắm tốt nhất với sản phẩm chất lượng, dịch vụ hậu mãi chu đáo và chính sách bảo hành uy tín. Bạn muốn tìm sản phẩm gì để mình tư vấn thêm nhé!";
}

function handleTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const day = now.getDay();
  const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const dateStr = now.toLocaleDateString('vi-VN');
  
  return `Hiện tại là ${hours}:${minutes}, ${days[day]}, ngày ${dateStr}. HTShop mở cửa phục vụ từ 8:00 đến 22:00 tất cả các ngày trong tuần, bao gồm cả ngày lễ và cuối tuần. Bạn có thể đến trực tiếp cửa hàng để trải nghiệm sản phẩm hoặc đặt hàng online 24/7 trên website htshop.vn. Ngoài ra, đội ngũ tư vấn viên của HTShop luôn sẵn sàng hỗ trợ bạn qua hotline 1900 1234 trong khung giờ làm việc.`;
}

function handleStock(products) {
  if (products && products.length > 0) {
    const inStock = products.filter(p => p.stock && p.stock > 0);
    const outOfStock = products.filter(p => !p.stock || p.stock === 0);

    if (inStock.length > 0) {
      let msg = `Hiện tại HTShop đang có sẵn ${inStock.length} sản phẩm trong danh mục này. Cụ thể: `;
      msg += inStock.map(p => `${p.name} (còn ${p.stock} sản phẩm)`).join(', ');

      if (outOfStock.length > 0) {
        msg += `. Các sản phẩm ${outOfStock.map(p => p.name).join(', ')} đã hết hàng và sẽ được nhập về trong thời gian sớm nhất.`;
      }

      msg += ` Bạn có thể đặt mua ngay để không bỏ lỡ sản phẩm yêu thích. Nếu cần tư vấn thêm, đừng ngần ngại hỏi HTShop nhé!`;
      return msg;
    }
    return `Hiện tại các sản phẩm này đang tạm thời hết hàng. Tuy nhiên, HTShop sẽ nhập hàng mới trong vài ngày tới. Bạn có thể đặt trước để được ưu tiên giao hàng khi hàng về. Ngoài ra, bạn có thể tham khảo các sản phẩm tương tự hoặc liên hệ hotline để được tư vấn thêm.`;
  }
  return `HTShop thường xuyên cập nhật hàng mới. Hiện tại sản phẩm bạn quan tâm chưa có trong kho, nhưng chúng mình có rất nhiều sản phẩm công nghệ đa dạng khác. Bạn có thể tham khảo danh mục sản phẩm trên website hoặc để HTShop gợi ý cho bạn những sản phẩm phù hợp nhất.`;
}

// 5. COMPARE
function handleCompare(products) {
  if (products && products.length >= 2) {
    const p1 = products[0];
    const p2 = products[1];

    let msg = `So sánh chi tiết giữa ${p1.name} và ${p2.name}:`;
    msg += `\n- ${p1.name}: ${p1.description || 'Sản phẩm chất lượng cao với thiết kế hiện đại'}. Giá bán: ${p1.price || 'Liên hệ'}.`;
    msg += `\n- ${p2.name}: ${p2.description || 'Sản phẩm được ưa chuộng với nhiều tính năng nổi bật'}. Giá bán: ${p2.price || 'Liên hệ'}.`;
    msg += `\n\n${p1.name} phù hợp với người dùng ${p1.price && parseInt(p1.price) < parseInt(p2.price) ? 'có ngân sách vừa phải' : 'tìm kiếm sản phẩm cao cấp'}, trong khi ${p2.name} lại hướng đến ${p2.price && parseInt(p2.price) < parseInt(p1.price) ? 'người dùng có ngân sách vừa phải' : 'người dùng tìm kiếm sản phẩm đẳng cấp'}.`;
    msg += ` Tùy vào nhu cầu sử dụng, ngân sách và sở thích cá nhân, bạn có thể lựa chọn sản phẩm phù hợp nhất. HTShop khuyên bạn nên xem đánh giá từ người dùng và tham khảo ý kiến tư vấn viên để có quyết định tốt nhất.`;
    return msg;
  }
  return "Để so sánh sản phẩm một cách chi tiết, bạn vui lòng cung cấp tên cụ thể của ít nhất 2 sản phẩm. HTShop sẽ phân tích ưu nhược điểm, giá cả, tính năng và đánh giá để giúp bạn lựa chọn được sản phẩm phù hợp nhất với nhu cầu. Ngoài ra, bạn có thể tham khảo bảng so sánh sản phẩm trên website htshop.vn để có cái nhìn tổng quan hơn.";
}

// 6. PRICE
function handlePrice(products, category) {
  if (products && products.length > 0) {
    const priceList = products.map(p => `${p.name}: ${p.price}`).join('; ');
    const minPrice = Math.min(...products.filter(p => p.price !== 'Liên hệ').map(p => parseInt(p.price.replace(/[^0-9]/g, ''))));
    const maxPrice = Math.max(...products.filter(p => p.price !== 'Liên hệ').map(p => parseInt(p.price.replace(/[^0-9]/g, ''))));

    let msg = `Về giá cả, HTShop có các lựa chọn đa dạng: ${priceList}.`;

    if (minPrice && maxPrice) {
      msg += ` Mức giá dao động từ ${minPrice.toLocaleString()}đ đến ${maxPrice.toLocaleString()}đ, phù hợp với nhiều đối tượng khách hàng.`;
    }

    msg += ` HTShop cam kết giá cả cạnh tranh nhất thị trường, thường xuyên có chương trình khuyến mãi hấp dẫn. Bạn có thể tham khảo thêm bảng giá chi tiết trên website hoặc liên hệ trực tiếp để được báo giá tốt nhất. Đặc biệt, HTShop hỗ trợ trả góp 0% lãi suất cho các sản phẩm có giá trị cao.`;
    return msg;
  }
  return `Vui lòng cho HTShop biết bạn muốn hỏi giá sản phẩm cụ thể nào để mình tư vấn chính xác nhất. HTShop có đa dạng sản phẩm công nghệ với nhiều mức giá khác nhau, từ bình dân đến cao cấp. Bạn có thể tham khảo bảng giá trên website hoặc để mình tư vấn giúp bạn sản phẩm phù hợp với ngân sách.`;
}

// 7. WARRANTY
function handleWarranty() {
  return `Về chính sách bảo hành, HTShop áp dụng các quy định sau:
  - Bảo hành chính hãng từ 12 đến 24 tháng tùy theo sản phẩm và thương hiệu.
  - Bảo hành 1 đổi 1 trong 30 ngày đầu nếu sản phẩm có lỗi kỹ thuật từ nhà sản xuất.
  - Hỗ trợ bảo hành tận nơi tại nhà cho các sản phẩm lớn.
  - Đội ngũ kỹ thuật viên chuyên nghiệp, giàu kinh nghiệm.
  - Quy trình bảo hành nhanh chóng, thủ tục đơn giản.
  - Bảo hành vàng cho khách hàng thân thiết.
  
  Bạn hoàn toàn yên tâm khi mua sắm tại HTShop. Mọi thắc mắc về bảo hành, vui lòng liên hệ hotline 1900 1234 để được hỗ trợ nhanh nhất.`;
}

// 8. SHIPPING
function handleShipping() {
  return `Về vận chuyển và giao hàng, HTShop có chính sách như sau:
  - Giao hàng nhanh toàn quốc, xử lý đơn hàng trong vòng 2-4 giờ làm việc.
  - Thời gian giao hàng: 1-3 ngày đối với các tỉnh thành, 3-5 ngày đối với khu vực vùng sâu vùng xa.
  - Miễn phí vận chuyển cho đơn hàng từ 500.000đ.
  - Hỗ trợ kiểm tra hàng trước khi nhận và thanh toán.
  - Đóng gói cẩn thận, chống sốc, chống nước để bảo vệ sản phẩm.
  - Theo dõi đơn hàng trực tuyến qua website.
  - Hỗ trợ giao hàng vào buổi tối và cuối tuần theo yêu cầu.
  
  Bạn cần giao hàng đến địa chỉ cụ thể nào để mình kiểm tra thời gian và chi phí giao hàng chính xác nhé!`;
}

// 9. PAYMENT
function handlePayment() {
  return `HTShop hỗ trợ đa dạng các hình thức thanh toán tiện lợi:
  - Thanh toán tiền mặt khi nhận hàng (COD) - Phương thức phổ biến và an toàn nhất.
  - Chuyển khoản qua ngân hàng (chuyển khoản nhanh 24/7).
  - Thanh toán qua thẻ tín dụng và thẻ ghi nợ (Visa, Mastercard, JCB).
  - Thanh toán qua ví điện tử: MoMo, ZaloPay, ShopeePay, ViettelPay.
  - Thanh toán trả góp 0% lãi suất qua các đối tác tài chính uy tín.
  - Thanh toán qua QR Code nhanh chóng.
  
  Bạn có thể lựa chọn hình thức thanh toán phù hợp nhất khi đặt hàng. HTShop cam kết bảo mật tuyệt đối thông tin thanh toán của khách hàng. Nếu cần hỗ trợ thêm về phương thức thanh toán, đừng ngần ngại hỏi HTShop nhé!`;
}

// 10. PROMOTION
function handlePromotion() {
  return `HTShop đang có nhiều chương trình ưu đãi và khuyến mãi hấp dẫn:
  - Giảm giá lên đến 30% cho các sản phẩm công nghệ hot nhất.
  - Tặng quà kèm giá trị khi mua combo sản phẩm.
  - Tích điểm thành viên để đổi quà và nhận ưu đãi đặc biệt.
  - Miễn phí vận chuyển cho tất cả đơn hàng trong tháng.
  - Ưu đãi đặc biệt dành cho khách hàng thân thiết và thành viên VIP.
  - Flash sale hàng tuần với giá sốc.
  - Chương trình giảm giá theo mùa, theo dịp lễ Tết.
  
  Đừng bỏ lỡ cơ hội săn sale hấp dẫn này! Theo dõi fanpage và website của HTShop để cập nhật chương trình khuyến mãi mới nhất. Nếu bạn cần tư vấn thêm về ưu đãi, HTShop sẵn sàng hỗ trợ bạn.`;
}

// 11. SERVICE
function handleService() {
  return `HTShop tự hào mang đến dịch vụ chăm sóc khách hàng chuyên nghiệp:
  - Tư vấn mua hàng tận tình, chính xác, không gây áp lực cho khách hàng.
  - Hỗ trợ kỹ thuật 24/7 qua điện thoại và chat trực tuyến.
  - Dịch vụ giao hàng tận nơi, lắp đặt và hướng dẫn sử dụng.
  - Bảo hành tận nơi và hỗ trợ sửa chữa nhanh chóng.
  - Đội ngũ nhân viên chuyên nghiệp, thân thiện và tận tâm.
  - Chính sách đổi trả linh hoạt, đảm bảo quyền lợi khách hàng.
  
  HTShop luôn đặt sự hài lòng của khách hàng lên hàng đầu. Bạn có thể liên hệ qua hotline 1900 1234, email support@htshop.vn hoặc đến trực tiếp cửa hàng để trải nghiệm dịch vụ tốt nhất.`;
}

// 12. PRODUCT FEATURES
function handleProductFeatures(products) {
  if (products && products.length > 0) {
    const p = products[0];
    const details = p.more_details || p.description || 'sản phẩm chất lượng cao với thiết kế hiện đại và nhiều tính năng vượt trội';

    return `${p.name} là sản phẩm ${p.category} với những tính năng nổi bật sau:
    ${details}
    
    Sản phẩm này được thiết kế để đáp ứng tốt nhu cầu của người dùng với công nghệ tiên tiến, độ bền cao và khả năng tương thích rộng. Bạn có thể xem thông số kỹ thuật chi tiết và đánh giá từ người dùng trên website htshop.vn. Nếu bạn cần tư vấn thêm về tính năng hoặc so sánh với sản phẩm khác, HTShop sẵn sàng hỗ trợ bạn.`;
  }
  return "Để tư vấn về tính năng chi tiết, bạn vui lòng cho HTShop biết tên cụ thể của sản phẩm bạn quan tâm. HTShop có đội ngũ chuyên gia kỹ thuật sẵn sàng giải đáp mọi thắc mắc về thông số, tính năng và cách sử dụng sản phẩm. Bạn cũng có thể tham khảo video giới thiệu sản phẩm và đánh giá của chuyên gia trên website của HTShop.";
}

// 13. PRODUCT BRAND
function handleProductBrand(products) {
  if (products && products.length > 0) {
    const p = products[0];
    return `${p.brand} là thương hiệu uy tín hàng đầu trong lĩnh vực công nghệ, nổi tiếng với chất lượng sản phẩm vượt trội và độ bền cao. Các sản phẩm ${p.brand} được sản xuất trên dây chuyền công nghệ hiện đại, đạt tiêu chuẩn quốc tế và được nhiều người dùng tin tưởng lựa chọn. HTShop tự hào là nhà phân phối chính thức của ${p.brand}, cam kết mang đến sản phẩm chính hãng 100% với giá tốt nhất thị trường. Nếu bạn quan tâm đến các sản phẩm ${p.brand}, HTShop sẽ tư vấn chi tiết để bạn có lựa chọn phù hợp nhất.`;
  }
  return "Để tư vấn về thương hiệu, bạn vui lòng cho HTShop biết tên cụ thể của thương hiệu bạn quan tâm. HTShop phân phối đa dạng các thương hiệu công nghệ nổi tiếng như Apple, Samsung, Sony, LG, Dell, HP, Lenovo, Asus và nhiều thương hiệu khác. Mỗi thương hiệu đều có những thế mạnh riêng, HTShop sẽ giúp bạn tìm hiểu và lựa chọn phù hợp nhất.";
}

// 14. PRODUCT GENERAL
function handleProductGeneral(products, category) {
  if (products && products.length > 0) {
    const productNames = products.slice(0, 3).map(p => `- ${p.name} (${p.brand})`).join('\n');
    const categories = [...new Set(products.map(p => p.category))].join(', ');

    return `Cảm ơn bạn đã quan tâm đến sản phẩm của HTShop! Dựa trên nhu cầu của bạn, chúng mình tìm thấy các sản phẩm phù hợp sau:
    ${productNames}
    
    Đây là những sản phẩm ${categories} chất lượng cao, được nhiều khách hàng tin tưởng và đánh giá tốt. Mỗi sản phẩm đều có những ưu điểm riêng, phù hợp với các nhu cầu sử dụng khác nhau. Bạn có thể xem chi tiết thông tin, đánh giá và so sánh các sản phẩm trên website htshop.vn. Nếu cần tư vấn thêm, HTShop sẵn sàng hỗ trợ bạn chọn được sản phẩm ưng ý nhất.`;
  }
  return `HTShop hiện chưa có sản phẩm phù hợp với yêu cầu của bạn trong kho. Tuy nhiên, chúng mình có rất nhiều sản phẩm công nghệ đa dạng khác với nhiều thương hiệu và mức giá khác nhau. Bạn có thể tham khảo danh mục sản phẩm trên website htshop.vn hoặc để HTShop tư vấn thêm những sản phẩm tương tự. HTShop luôn sẵn sàng hỗ trợ bạn tìm được sản phẩm tốt nhất.`;
}

// 15. PURCHASE
function handlePurchase() {
  return `HTShop rất vui được hỗ trợ bạn mua sắm! Để mua hàng tại HTShop, bạn có thể:
  - Đặt hàng trực tiếp trên website htshop.vn
  - Gọi hotline 1900 1234 để đặt hàng qua điện thoại
  - Đến trực tiếp cửa hàng gần nhất để trải nghiệm và mua sản phẩm
  - Chat trực tiếp với nhân viên tư vấn để được hỗ trợ đặt hàng nhanh chóng
  
  HTShop có đa dạng sản phẩm công nghệ chính hãng với giá cạnh tranh, hỗ trợ trả góp 0% và miễn phí vận chuyển. Bạn muốn tìm sản phẩm gì để mình hướng dẫn chi tiết cách đặt hàng và thông tin khuyến mãi hiện tại nhé!`;
}

// 16. ADVICE
function handleAdvice() {
  return `HTShop sẵn sàng tư vấn cho bạn lựa chọn sản phẩm tốt nhất! Để tư vấn chính xác, bạn vui lòng cho mình biết:
  1. Bạn cần sản phẩm gì? (điện thoại, laptop, tai nghe, v.v.)
  2. Ngân sách dự kiến của bạn là bao nhiêu?
  3. Bạn ưu tiên tính năng nào nhất? (hiệu năng, thiết kế, pin, camera, v.v.)
  4. Bạn sử dụng sản phẩm cho mục đích gì? (học tập, làm việc, giải trí, v.v.)
  
  Dựa trên thông tin này, HTShop sẽ tư vấn những sản phẩm phù hợp nhất với nhu cầu và ngân sách của bạn. HTShop cam kết tư vấn trung thực, khách quan, giúp bạn có quyết định mua sắm thông minh. Nếu bạn chưa rõ nhu cầu, mình có thể hỏi thêm để hiểu rõ hơn nhé!`;
}

// 17. THANK
function handleThank() {
  const responses = [
    "Rất vui được giúp đỡ bạn! HTShop luôn ở đây để hỗ trợ bạn bất cứ khi nào cần. Chúc bạn có trải nghiệm mua sắm tuyệt vời và hẹn gặp lại bạn!",
    "Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của HTShop! Chúng mình rất trân trọng sự ủng hộ của bạn. Nếu có bất kỳ thắc mắc nào, đừng ngần ngại quay lại hỏi HTShop nhé!",
    "Không có gì bạn ơi! HTShop rất vui khi được hỗ trợ bạn. Chúc bạn một ngày tốt lành và mong được phục vụ bạn trong những lần mua sắm tiếp theo!"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// 18. COMPLAINT
function handleComplaint() {
  return `HTShop rất tiếc và xin lỗi bạn vì những trải nghiệm không tốt. Chúng mình luôn đặt sự hài lòng của khách hàng lên hàng đầu và rất mong muốn giải quyết vấn đề của bạn một cách nhanh chóng và hiệu quả.
  
  Bạn vui lòng cho HTShop biết chi tiết vấn đề để chúng mình có thể:
  - Xác minh và tìm hiểu nguyên nhân
  - Đưa ra giải pháp khắc phục phù hợp nhất
  - Bồi thường và hỗ trợ bạn theo chính sách
  
  Bạn có thể gửi khiếu nại qua email complaint@htshop.vn hoặc gọi trực tiếp hotline 1900 1234 để được bộ phận chăm sóc khách hàng tiếp nhận và xử lý trong thời gian sớm nhất. HTShop cam kết sẽ xử lý mọi khiếu nại một cách minh bạch, công bằng và nhanh chóng.`;
}

// 19. RETURN POLICY
function handleReturnPolicy() {
  return `Về chính sách đổi trả, HTShop áp dụng các quy định sau:
  - Hỗ trợ đổi trả trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm có lỗi kỹ thuật từ nhà sản xuất.
  - Đổi sản phẩm khác hoặc hoàn tiền 100% cho khách hàng.
  - Sản phẩm phải còn nguyên tem, phiếu bảo hành và hộp đựng.
  - Không áp dụng đổi trả đối với sản phẩm đã qua sử dụng hoặc bị hư hỏng do tác động bên ngoài.
  - Hỗ trợ đổi trả tận nơi cho các sản phẩm cồng kềnh.
  - Thủ tục đổi trả đơn giản, nhanh chóng, không gây phiền hà cho khách hàng.
  
  HTShop luôn đặt quyền lợi của khách hàng lên hàng đầu. Nếu bạn có nhu cầu đổi trả, vui lòng liên hệ hotline 1900 1234 hoặc mang sản phẩm đến cửa hàng gần nhất để được hỗ trợ nhanh nhất.`;
}

// 20. INSTALLMENT
function handleInstallment() {
  return `HTShop hỗ trợ trả góp 0% lãi suất cho các sản phẩm có giá trị từ 3 triệu đồng trở lên. Cụ thể:
  - Thời gian trả góp: 6 tháng, 9 tháng, 12 tháng, 18 tháng hoặc 24 tháng tùy lựa chọn.
  - Đối tác tài chính: Home Credit, FE Credit, HD Saison, Mirae Asset.
  - Thủ tục đơn giản, giải ngân nhanh chóng trong vòng 15-30 phút.
  - Hỗ trợ trả góp online qua website hoặc trực tiếp tại cửa hàng.
  - Điều kiện: Khách hàng từ 20 tuổi trở lên, có CMND/CCCD và hợp đồng lao động hoặc giấy tờ chứng minh thu nhập.
  
  Với hình thức trả góp, bạn có thể sở hữu ngay sản phẩm yêu thích mà không phải lo lắng về tài chính. Bạn cần mình tư vấn thêm về thủ tục trả góp không?`;
}

// 21. AUTHENTIC
function handleAuthentic() {
  return `HTShop cam kết bán sản phẩm chính hãng 100% và khẳng định:
  - Tất cả sản phẩm đều có nguồn gốc xuất xứ rõ ràng, nhập khẩu chính ngạch.
  - Đầy đủ giấy tờ, hóa đơn chứng minh nguồn gốc.
  - Tem chống hàng giả, mã QR code để kiểm tra thông tin sản phẩm.
  - Sản phẩm được bảo hành chính hãng và có phiếu bảo hành đầy đủ.
  - HTShop là nhà phân phối chính thức của nhiều thương hiệu lớn.
  - Nếu phát hiện hàng giả, HTShop cam kết bồi thường gấp 3 lần giá trị sản phẩm.
  
  Bạn hoàn toàn có thể yên tâm khi mua sắm tại HTShop. Chúng mình luôn đặt uy tín và chất lượng lên hàng đầu để mang lại sự tin tưởng và hài lòng cho khách hàng. Nếu bạn muốn kiểm tra thông tin sản phẩm, hãy quét mã QR trên sản phẩm hoặc liên hệ HTShop để được hỗ trợ.`;
}

// 22. TECHNICAL
function handleTechnical(products) {
  if (products && products.length > 0) {
    const p = products[0];
    return `Về vấn đề kỹ thuật với sản phẩm ${p.name}, HTShop khuyên bạn:
    - Kiểm tra kỹ hướng dẫn sử dụng đi kèm sản phẩm.
    - Liên hệ tổng đài kỹ thuật 1900 5678 để được hỗ trợ từ xa.
    - Mang sản phẩm đến trung tâm bảo hành gần nhất để được kiểm tra và sửa chữa.
    - Không tự ý tháo lắp hoặc sửa chữa nếu không có chuyên môn.
    - Cập nhật phần mềm/driver mới nhất để đảm bảo hiệu suất.
    
    Đội ngũ kỹ thuật viên của HTShop giàu kinh nghiệm, được đào tạo bài bản, sẵn sàng hỗ trợ bạn giải quyết mọi vấn đề kỹ thuật. Nếu cần hỗ trợ khẩn cấp, bạn có thể gọi hotline kỹ thuật 24/7 để được tư vấn ngay lập tức.`;
  }
  return `Về vấn đề kỹ thuật, HTShop có đội ngũ chuyên gia giàu kinh nghiệm sẵn sàng hỗ trợ bạn. Bạn vui lòng cho biết:
  - Sản phẩm bạn đang gặp vấn đề là gì?
  - Lỗi cụ thể bạn gặp phải là gì?
  - Bạn đã thử các cách khắc phục nào?
  
  Dựa trên thông tin này, HTShop sẽ tư vấn cách xử lý phù hợp nhất. Bạn cũng có thể mang sản phẩm đến cửa hàng để được kiểm tra và hỗ trợ trực tiếp. Ngoài ra, HTShop có dịch vụ sửa chữa tại nhà cho các sản phẩm lớn.`;
}

function handleGeneral(products, category) {
  if (products && products.length > 0) {
    const productNames = products.slice(0, 3).map(p => `- ${p.name} (${p.brand})`).join('\n');
    return `Cảm ơn câu hỏi thú vị của bạn! HTShop đã tìm thấy một số sản phẩm liên quan đến nhu cầu của bạn:
    ${productNames}
    
  
    Đây là những sản phẩm ${category || 'công nghệ'} được đánh giá cao, phù hợp với nhiều đối tượng khách hàng. HTShop khuyên bạn nên xem chi tiết thông số và đánh giá của người dùng để có cái nhìn tổng quan. Nếu bạn cần thêm thông tin chi tiết về bất kỳ sản phẩm nào, đừng ngần ngại hỏi HTShop nhé!
    
    Ngoài ra, HTShop có nhiều sản phẩm công nghệ đa dạng khác. Bạn có thể tham khảo thêm trên website htshop.vn hoặc để mình gợi ý thêm những sản phẩm tương tự.`;
  }


  return `Cảm ơn bạn đã đặt câu hỏi cho HTShop! Đây là một câu hỏi rất hay và thú vị. HTShop luôn sẵn sàng hỗ trợ bạn tìm ra giải pháp tốt nhất.
  
  Hiện tại, HTShop có rất nhiều sản phẩm công nghệ đa dạng với nhiều thương hiệu và mức giá khác nhau. Bạn có thể:
  - Tham khảo danh mục sản phẩm trên website htshop.vn
  - Gọi hotline 1900 1234 để được tư vấn trực tiếp
  - Đến cửa hàng gần nhất để trải nghiệm sản phẩm
  - Chat với nhân viên tư vấn để được hỗ trợ nhanh chóng
  
  Nếu bạn có thể cung cấp thêm thông tin về nhu cầu cụ thể, HTShop sẽ tư vấn được chính xác hơn. Chúng mình rất mong được hỗ trợ bạn tìm được sản phẩm ưng ý nhất!`;
}

// ==================== MAIN CHATBOT HANDLER ====================
exports.chatbotHandler = async (req, res) => {
  const startTime = Date.now();
  const { question } = req.body;

  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "Vui lòng nhập câu hỏi." });
  }

  try {
    const trimmedQuestion = question.trim();
    console.log(`Processing: "${trimmedQuestion}"`);

    // ===== STEP 1: DETECT CATEGORY =====
    const detectedCat = detectCategory(trimmedQuestion);

    // ===== STEP 2: SEARCH PRODUCTS =====
    let products = [];
    let productData = [];

    // Tìm kiếm nâng cao
    if (detectedCat) {
      products = await searchProducts(detectedCat, 5);
    } else {
      products = await searchProducts(trimmedQuestion, 5);
    }

    // Nếu không tìm thấy, thử tìm theo danh mục
    if (products.length === 0 && detectedCat) {
      products = await Product.find({
        category: { $regex: detectedCat, $options: 'i' }
      })
      .limit(3)
      .lean()
      .select('productName brandName category sellingPrice description productImage');
    }

    // Format product data
    if (products && products.length > 0) {
      productData = products.slice(0, 3).map(p => ({
        _id: p._id,
        name: p.productName,
        brand: p.brandName,
        category: p.category,
        price: p.sellingPrice ? `${p.sellingPrice.toLocaleString()}đ` : 'Liên hệ',
        description: p.description ? p.description.substring(0, 200) : '',
        productImage: p.productImage || '',
        stock: p.productStock || 0,
        more_details: p.more_details || '',
      }));
    }

    // ===== STEP 3: TRY AI =====
    // ===== STEP 3: TRY AI (FREE) =====
    let answer = null;
    let usedAI = false;

    if (process.env.OPENROUTER_API_KEY) {
      try {
        const systemPrompt = `Bạn là trợ lý bán hàng chuyên nghiệp của HTShop. 
        
QUY TẮC:
- Trả lời bằng tiếng Việt, văn phong trang trọng, chuyên nghiệp
- Xưng là "HTShop" hoặc "chúng tôi", gọi khách là "quý khách" hoặc "bạn"
- Trả lời đúng trọng tâm, đầy đủ thông tin, không lan man
- Nếu có sản phẩm, giới thiệu chi tiết và khuyến khích xem thêm
- Nếu không có, tư vấn hướng dẫn tận tình
- Luôn thể hiện thái độ tích cực, nhiệt tình
- Tối đa 4-5 câu cho mỗi câu trả lời
- Không sử dụng icon, emoji trong câu trả lời`;

        let userPrompt = `Câu hỏi của khách hàng: "${trimmedQuestion}"`;
        
        if (productData.length > 0) {
          userPrompt += `\n\nDanh sách sản phẩm phù hợp (đã sắp xếp theo độ liên quan):
${JSON.stringify(productData, null, 2)}

Yêu cầu:
1. Dựa vào danh sách sản phẩm trên để trả lời
2. Chỉ sử dụng tên chính xác của sản phẩm trong danh sách
3. Không bịa thêm sản phẩm không có trong danh sách
4. Giới thiệu ngắn gọn và khuyến khích khách xem chi tiết`;
        }

        const aiResponse = await callFreeAI([
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ], 250);

        if (aiResponse && aiResponse.length > 10) {
          answer = aiResponse;
          usedAI = true;

          console.log("AI response successful");
        }
      } catch (aiError) {
        console.log("AI failed:", aiError.message);
      }
    }

    // ===== STEP 4: ULTRA SMART FALLBACK =====
    if (!answer) {
      answer = generateUltraSmartResponse(trimmedQuestion, productData, detectedCat);
      console.log("Using ultra smart fallback");
    }

    // ===== STEP 5: DETECT SUGGESTED PRODUCTS =====
    const normalizedAnswer = normalizeString(answer);
    const suggestedProducts = productData.filter(p =>
      normalizedAnswer.includes(normalizeString(p.name))
    );

    // ===== STEP 6: SAVE CHAT HISTORY =====
    // ===== STEP 6: SAVE CHAT =====
    try {
      await Chat.create({ 
        question: trimmedQuestion, 
        answer: answer,
        timestamp: new Date()
      });
    } catch (saveError) {
      console.error("Save error:", saveError);
    }

    // ===== STEP 7: RETURN RESPONSE =====
    const processingTime = Date.now() - startTime;
    console.log(`[HTShop Chatbot] Response time: ${processingTime}ms (${usedAI ? 'AI' : 'Fallback'})`);
    console.log(`Response time: ${processingTime}ms (${usedAI ? 'AI' : 'Fallback'})`);

    return res.json({
      success: true,
      answer: answer,
      suggestedProducts: suggestedProducts.length > 0 ? suggestedProducts : productData.slice(0, 2),
      products: productData,
      metadata: {
        processingTime: `${processingTime}ms`,
        usedAI: usedAI,
        hasProducts: productData.length > 0,
        category: detectedCat || 'general',
        productCount: productData.length,
        answerLength: answer.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Chatbot error:", error);

    const emergencyAnswer = `Xin lỗi quý khách, HTShop đang gặp sự cố kỹ thuật tạm thời. Tuy nhiên, chúng tôi vẫn sẵn sàng hỗ trợ quý khách! Quý khách vui lòng thử lại sau vài phút hoặc liên hệ trực tiếp hotline 1900 1234 để được tư vấn viên hỗ trợ nhanh nhất. HTShop xin cảm ơn sự thông cảm của quý khách.`;

    try {
      await Chat.create({ 
        question: req.body.question || 'unknown', 
        answer: emergencyAnswer,
        error: error.message,
        timestamp: new Date()
      });
    } catch (saveError) {
      console.error("Save error:", saveError);
    }

    return res.status(200).json({
      success: true,
      answer: emergencyAnswer,
      suggestedProducts: [],
      products: [],
      metadata: {
        error: true,
        processingTime: `${Date.now() - startTime}ms`,
        message: error.message
      }
    });
  }
};