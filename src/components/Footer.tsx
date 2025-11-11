import Link from 'next/link';
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">Về CGV</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/about" className="hover:text-white transition">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white transition">
                  Tuyển dụng
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xl font-bold mb-4">Hỗ trợ</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">Liên hệ</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-center space-x-2">
                <FiPhone />
                <span>1900 6017</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiMail />
                <span>support@cgv.vn</span>
              </li>
              <li className="flex items-start space-x-2">
                <FiMapPin className="mt-1" />
                <span>123 Nguyễn Huệ, Quận 1, TP.HCM</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-xl font-bold mb-4">Theo dõi chúng tôi</h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FF6B35] transition-colors hover:scale-110 transform duration-200"
              >
                <FiFacebook />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FF6B35] transition-colors hover:scale-110 transform duration-200"
              >
                <FiTwitter />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FF6B35] transition-colors hover:scale-110 transform duration-200"
              >
                <FiInstagram />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#FF6B35] transition-colors hover:scale-110 transform duration-200"
              >
                <FiYoutube />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 CGV Vietnam. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

