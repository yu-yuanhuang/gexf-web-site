#!/usr/bin/env python3
"""Convert a Gephi-flavored GEXF (1.1draft) file into a simple JSON graph.

This script is included so you can swap in another .gexf and regenerate graph.json.

Usage:
  python convert_gexf_to_json.py graph.gexf graph.json
"""

import json
import sys
import xml.etree.ElementTree as ET
from typing import Any, Dict

NS = {
    "g": "http://www.gephi.org/gexf/1.1draft",
}


def parse_float(x: str):
    try:
        return float(x)
    except Exception:
        return None


def main(inp: str, outp: str) -> None:
    root = ET.parse(inp).getroot()

    graph_el = root.find("g:graph", NS)
    if graph_el is None:
        raise SystemExit("Invalid GEXF: missing <graph>.")

    meta: Dict[str, Any] = {
        "creator": root.findtext("g:meta/g:creator", default="", namespaces=NS),
        "description": root.findtext("g:meta/g:description", default="", namespaces=NS),
        "defaultEdgeType": graph_el.get("defaultedgetype", "undirected"),
        "mode": graph_el.get("mode", "static"),
        "timeformat": graph_el.get("timeformat", ""),
    }

    nodes_el = graph_el.find("g:nodes", NS)
    edges_el = graph_el.find("g:edges", NS)
    if nodes_el is None or edges_el is None:
        raise SystemExit("Invalid GEXF: missing <nodes> or <edges>.")

    nodes = []
    for n in nodes_el.findall("g:node", NS):
        nid = n.get("id")
        label = n.get("label", nid)
        attrs: Dict[str, Any] = {}
        avs = n.find("g:attvalues", NS)
        if avs is not None:
            for av in avs.findall("g:attvalue", NS):
                k = av.get("for")
                v = av.get("value")
                if not k:
                    continue
                # keep both raw string & numeric where sensible
                num = parse_float(v) if v is not None else None
                attrs[k] = num if num is not None else v
        nodes.append({"id": nid, "label": label, "attributes": attrs})

    edges = []
    for e in edges_el.findall("g:edge", NS):
        eid = e.get("id")
        source = e.get("source")
        target = e.get("target")
        w = parse_float(e.get("weight", ""))
        attrs: Dict[str, Any] = {}
        avs = e.find("g:attvalues", NS)
        if avs is not None:
            for av in avs.findall("g:attvalue", NS):
                k = av.get("for")
                v = av.get("value")
                if not k:
                    continue
                num = parse_float(v) if v is not None else None
                attrs[k] = num if num is not None else v
        edges.append({"id": eid, "source": source, "target": target, "weight": w, "attributes": attrs})

    payload = {
        "meta": meta,
        "nodes": nodes,
        "edges": edges,
        "stats": {"nodes": len(nodes), "edges": len(edges)},
    }

    with open(outp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_gexf_to_json.py <input.gexf> <output.json>")
        raise SystemExit(2)
    main(sys.argv[1], sys.argv[2])
