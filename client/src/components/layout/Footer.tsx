import { Construction } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Logo and Name */}
          <div className="flex items-center mb-4 md:mb-0">
            <Construction className="h-6 w-6 text-green-600 mr-2" />
          </div>
          
          {/* Copyright */}
          <p className="text-gray-400 text-sm text-center md:text-right">
            © 2025. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;