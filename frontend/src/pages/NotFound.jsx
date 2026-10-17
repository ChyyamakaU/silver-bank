import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';

const NotFound = () => (
  <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
    <Card className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-3xl font-bold text-charcoal">404 - Page Not Found</h1>
      <p className="text-sm text-muted">The page you are looking for does not exist.</p>
      <Link to="/">
        <Button>Back to home</Button>
      </Link>
    </Card>
  </div>
);

export default NotFound;
