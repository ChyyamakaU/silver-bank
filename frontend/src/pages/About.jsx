import Card from '../components/Card';

const About = () => (
  <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
    <div className="space-y-2">
      <h1 className="text-3xl font-bold text-charcoal sm:text-4xl">About Silver Bank</h1>
      <p className="text-base text-muted">
        Silver Bank is a modern digital banking experience designed to make everyday banking simple, secure, and accessible.
      </p>
    </div>
    <Card className="space-y-4">
      <h2 className="text-xl font-semibold text-charcoal">Our Mission</h2>
      <p className="text-sm text-muted leading-relaxed">
        To deliver a trusted, seamless banking platform that empowers customers to manage their finances with confidence.
      </p>
      <h2 className="text-xl font-semibold text-charcoal">Our Vision</h2>
      <p className="text-sm text-muted leading-relaxed">
        To be the go-to digital bank for secure, transparent, and customer-focused financial services in Nigeria.
      </p>
      <p className="text-xs text-muted">
        Disclaimer: This is a demonstration application and is not a licensed financial institution.
      </p>
    </Card>
  </div>
);

export default About;
