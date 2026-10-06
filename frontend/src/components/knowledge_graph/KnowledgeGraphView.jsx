import React, { useEffect, useState, useMemo } from "react";
import { GitFork, Loader2, RefreshCw, ZoomIn, ZoomOut, Search } from "lucide-react";
import { apiClient } from "../../api/client";

export default function KnowledgeGraphView({ subjectId }) {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  const fetchGraph = async () => {
    if (!subjectId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get(`/subjects/${subjectId}/graph`);
      if (res && Array.isArray(res.nodes) && Array.isArray(res.edges)) {
        setGraphData({ nodes: res.nodes, edges: res.edges });
      } else {
        setGraphData({ nodes: [], edges: [] });
      }
    } catch (err) {
      console.error("Failed to fetch subject knowledge graph:", err);
      setError(err?.message || "Failed to load knowledge graph");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [subjectId]);

  // Compute 2D node coordinates for SVG layout
  const nodePositions = useMemo(() => {
    const nodes = graphData.nodes || [];
    if (nodes.length === 0) return {};

    const positions = {};
    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 80;

    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        label: node.label || node.id,
      };
    });

    return positions;
  }, [graphData.nodes]);

  // Filter nodes by search
  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return graphData.nodes;
    const term = searchTerm.toLowerCase().trim();
    return graphData.nodes.filter(
      (n) => n.label && n.label.toLowerCase().includes(term)
    );
  }, [graphData.nodes, searchTerm]);

  if (isLoading) {
    return (
      <div
        className="card"
        style={{
          padding: 40,
          textAlign: "center",
          color: "#64748b",
          marginTop: 20,
        }}
      >
        <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 12px" }} />
        <p style={{ margin: 0, fontSize: 14 }}>Loading Subject Knowledge Graph...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="card"
        style={{
          padding: 30,
          textAlign: "center",
          color: "#ef4444",
          marginTop: 20,
        }}
      >
        <p style={{ margin: "0 0 12px", fontWeight: 600 }}>{error}</p>
        <button
          type="button"
          onClick={fetchGraph}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #ef4444",
            background: "transparent",
            color: "#ef4444",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const nodesCount = graphData.nodes?.length || 0;
  const edgesCount = graphData.edges?.length || 0;

  return (
    <div className="card knowledge-graph-container" style={{ marginTop: 20, padding: 24 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="upload-icon" style={{ flexShrink: 0 }}>
              <GitFork size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              Subject Knowledge Graph
            </h3>
          </div>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
            Extracted concept terms & relationships ({nodesCount} concepts, {edgesCount} edges)
          </p>
        </div>

        {/* SEARCH FILTER */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 10,
                top: 10,
                color: "#64748b",
              }}
            />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "7px 12px 7px 32px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                fontSize: 13,
                background: "var(--card-bg)",
                color: "inherit",
                width: 180,
              }}
            />
          </div>
          <button
            type="button"
            onClick={fetchGraph}
            title="Refresh Knowledge Graph"
            style={{
              padding: 8,
              borderRadius: 8,
              border: "1px solid var(--border-color)",
              background: "var(--card-bg)",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* GRAPH CANVAS / SVG */}
      {nodesCount === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            background: "#f8fafc",
            borderRadius: 12,
            border: "1px dashed #cbd5e1",
          }}
        >
          <GitFork size={36} style={{ color: "#94a3b8", margin: "0 auto 10px" }} />
          <h4 style={{ margin: "0 0 6px", color: "#334155" }}>No Concept Edges Extracted Yet</h4>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            Knowledge graph relationships will appear here automatically after lecture content generation.
          </p>
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 520,
            background: "var(--card-bg, #ffffff)",
            borderRadius: 12,
            border: "1px solid var(--border-color, #e2e8f0)",
            overflow: "hidden",
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="28"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
              </marker>
              <marker
                id="arrowhead-active"
                markerWidth="10"
                markerHeight="7"
                refX="28"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
              </marker>
            </defs>

            {/* EDGES */}
            {graphData.edges.map((edge) => {
              const srcPos = nodePositions[edge.source];
              const tgtPos = nodePositions[edge.target];
              if (!srcPos || !tgtPos) return null;

              const isHighlighted =
                selectedNode === edge.source ||
                selectedNode === edge.target ||
                hoveredEdge?.id === edge.id;

              const midX = (srcPos.x + tgtPos.x) / 2;
              const midY = (srcPos.y + tgtPos.y) / 2;

              return (
                <g key={edge.id} onMouseEnter={() => setHoveredEdge(edge)} onMouseLeave={() => setHoveredEdge(null)}>
                  <line
                    x1={srcPos.x}
                    y1={srcPos.y}
                    x2={tgtPos.x}
                    y2={tgtPos.y}
                    stroke={isHighlighted ? "#2563eb" : "#cbd5e1"}
                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                    markerEnd={isHighlighted ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                    style={{ transition: "stroke 0.2s, stroke-width 0.2s" }}
                  />
                  {/* EDGE RELATIONSHIP LABEL */}
                  <rect
                    x={midX - (edge.label.length * 3.5 + 8)}
                    y={midY - 9}
                    width={edge.label.length * 7 + 16}
                    height={18}
                    rx={4}
                    fill={isHighlighted ? "#dbeafe" : "#f1f5f9"}
                    stroke={isHighlighted ? "#93c5fd" : "#e2e8f0"}
                    strokeWidth={1}
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill={isHighlighted ? "#1e40af" : "#475569"}
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* NODES */}
            {graphData.nodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const isSelected = selectedNode === node.id;
              const isMatch =
                searchTerm.trim() &&
                node.label.toLowerCase().includes(searchTerm.toLowerCase().trim());

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNode(isSelected ? null : node.id)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r={isSelected ? 22 : 18}
                    fill={isSelected ? "#2563eb" : isMatch ? "#f59e0b" : "#3b82f6"}
                    stroke="#ffffff"
                    strokeWidth={3}
                    style={{ transition: "r 0.2s, fill 0.2s" }}
                  />
                  <text
                    y={32}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={700}
                    fill="var(--text-main, #0f274f)"
                  >
                    {pos.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
