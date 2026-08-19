import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { projectService } from '../../services/resources';
import { formatINR } from '../../utils/format';
import { Badge, PageLoader, EmptyState } from '../../components/ui/Primitives';

export default function DeveloperProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService
      .list()
      .then(({ data }) => setProjects(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-2xl font-serif text-charcoal-900 mb-6">Projects</h1>

      {projects.length === 0 ? (
        <EmptyState icon={Layers} title="No projects yet" description="Create a project to start managing buildings and units." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white border border-stone-100 overflow-hidden">
              {project.images?.[0]?.url && (
                <img src={project.images[0].url} alt={project.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-serif text-charcoal-900">{project.name}</p>
                  <Badge>{project.constructionStatus?.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="text-xs text-charcoal-500 mb-3">{project.location?.locality}, {project.location?.city}</p>
                <div className="flex justify-between text-xs text-charcoal-600 border-t border-stone-100 pt-3">
                  <span>{project.availableUnits} / {project.totalUnits} available</span>
                  <span>{formatINR(project.priceRange?.min)} - {formatINR(project.priceRange?.max)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
