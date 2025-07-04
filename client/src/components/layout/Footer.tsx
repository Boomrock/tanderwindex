import { Construction } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          {/* Copyright */}
          <p className="text-gray-400 text-sm text-center">
            © 2025. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;