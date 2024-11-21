import React, { useState, useCallback, useEffect } from 'react';
import { PlusIcon, MinusIcon, TrashIcon, VariableIcon, MenuIcon, FolderPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Existing constants and types remain the same
const ElementTypes = {
  HEADING1: 'h1',
  HEADING2: 'h2',
  HEADING3: 'h3',
  PARAGRAPH: 'p',
  UNORDERED_LIST: 'ul',
  ORDERED_LIST: 'ol',
  SPAN: 'span',
  STRONG: 'strong',
  BREAK: 'br'
};

const defaultContent = {
  ul: [{ id: uuidv4(), content: 'List item 1', description: null, nestedSpans: [] }],
  ol: [{ id: uuidv4(), content: 'List item 1', description: null, nestedSpans: [] }],
  br: '', 
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  p: 'Paragraph text',
  strong: 'Bold text',
  span: 'Span text'
};

const getElementTypeName = (type) => {
  const typeNames = {
    h1: 'Heading 1',
    h2: 'Heading 2',
    h3: 'Heading 3',
    p: 'Paragraph',
    ul: 'Unordered List',
    ol: 'Ordered List',
    span: 'Span',
    strong: 'Strong',
    br: 'Line Break'
  };
  return typeNames[type] || type.toUpperCase();
};

// Group management components
const GroupContainer = ({ group, elements, onRemoveGroup, onToggleCollapse, onUpdateGroupTitle, selectedElements, onElementSelect }) => {
  return (
    <div className="mb-4 border-l-4 border-blue-500 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-t-lg">
        <div className="flex items-center gap-2">
          <button onClick={() => onToggleCollapse(group.id)} className="p-1">
            {group.isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <input
            type="text"
            value={group.title}
            onChange={(e) => onUpdateGroupTitle(group.id, e.target.value)}
            className="bg-transparent border-none focus:outline-none font-semibold"
          />
        </div>
        <button onClick={() => onRemoveGroup(group.id)} className="text-red-500 p-1">
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
      {!group.isCollapsed && (
        <div className="p-4">
          {elements.map(element => (
            <Element
              key={element.id}
              element={element}
              isSelected={selectedElements.includes(element.id)}
              onSelect={() => onElementSelect(element.id)}
              isInGroup={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const GroupActions = ({ selectedElements, onCreateGroup }) => {
  if (selectedElements.length < 2) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50">
      <button
        onClick={onCreateGroup}
        className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
      >
        <FolderPlus className="h-4 w-4" />
        Create Group ({selectedElements.length} items)
      </button>
    </div>
  );
};

// Modified Element component to include selection
const Element = ({ element, isSelected, onSelect, isInGroup, ...props }) => {
  const [showDescription, setShowDescription] = useState(!!element.description);

  return (
    <div className={`mb-4 relative bg-white rounded-lg shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="absolute top-2 left-2 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect()}
          className="h-4 w-4"
        />
      </div>
      <div className="flex items-center justify-between p-4 pt-8">
        <h3 className="text-lg font-semibold">{getElementTypeName(element.type)}</h3>
        {props.onRemove && (
          <button onClick={props.onRemove} className="text-red-500 hover:text-red-700">
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="p-4 pt-0">
        {/* Element content here */}
      </div>
    </div>
  );
};

// Main component
const JsonTemplateBuilderWithGroups = () => {
  const [elements, setElements] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedElements, setSelectedElements] = useState([]);
  const [jsonSchema, setJsonSchema] = useState('');

  // Group management functions
  const createGroup = useCallback(() => {
    if (selectedElements.length < 2) return;

    setGroups(prev => [...prev, {
      id: uuidv4(),
      title: `Group ${prev.length + 1}`,
      elements: selectedElements,
      isCollapsed: false
    }]);

    setSelectedElements([]);
  }, [selectedElements]);

  const removeGroup = useCallback((groupId) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
  }, []);

  const toggleGroupCollapse = useCallback((groupId) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, isCollapsed: !g.isCollapsed } : g
    ));
  }, []);

  const updateGroupTitle = useCallback((groupId, title) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, title } : g
    ));
  }, []);

  const toggleElementSelection = useCallback((elementId) => {
    setSelectedElements(prev =>
      prev.includes(elementId)
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    );
  }, []);

  // Element management functions
  const addElement = useCallback((type) => {
    setElements(prev => [...prev, {
      id: uuidv4(),
      type,
      content: defaultContent[type] || '',
      description: null,
      isDynamic: false
    }]);
  }, []);

  const removeElement = useCallback((id) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setGroups(prev => prev.map(group => ({
      ...group,
      elements: group.elements.filter(elementId => elementId !== id)
    })));
  }, []);

  // Schema conversion function
  const convertToJsonSchema = useCallback(() => ({
    schema: {
      description: "Ensure that only the required data fields specified in the template are generated...",
      properties: {
        tag: { enum: ['body'] },
        children: [
          ...groups.map(group => ({
            properties: {
              tag: { enum: ['div'] },
              className: { enum: [`group-${group.id}`] },
              children: group.elements.map(elementId => {
                const element = elements.find(e => e.id === elementId);
                if (!element) return null;

                const baseProps = { 
                  tag: { 
                    enum: [element.type === 'p' && element.content.trim() !== '' ? 'div' : element.type] 
                  }
                };

                return {
                  properties: {
                    ...baseProps,
                    content: element.content.trim() !== ''
                      ? { enum: [element.content] }
                      : (element.description ? { description: element.description } : undefined),
                    children: null
                  }
                };
              }).filter(Boolean)
            }
          })),
          ...elements
            .filter(element => !groups.some(group => group.elements.includes(element.id)))
            .map(element => {
              const baseProps = { 
                tag: { 
                  enum: [element.type === 'p' && element.content.trim() !== '' ? 'div' : element.type] 
                }
              };

              if (element.type === 'br') {
                return { properties: baseProps };
              }

              return {
                properties: {
                  ...baseProps,
                  content: element.content.trim() !== ''
                    ? { enum: [element.content] }
                    : (element.description ? { description: element.description } : undefined),
                  children: null
                }
              };
            })
        ]
      }
    }
  }), [elements, groups]);

  // Update JSON schema when elements or groups change
  useEffect(() => {
    const schema = convertToJsonSchema();
    setJsonSchema(JSON.stringify(schema, null, 2));
  }, [elements, groups, convertToJsonSchema]);

  const elementIsInGroup = useCallback((elementId) => {
    return groups.some(group => group.elements.includes(elementId));
  }, [groups]);

  return (
    <div className="font-sans p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">JSON Template Builder</h1>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Add Elements</h2>
            {Object.entries(ElementTypes).map(([key, value]) => (
              <button
                key={key}
                onClick={() => addElement(value)}
                className="block w-full mb-2 text-left text-blue-500 hover:text-blue-700"
              >
                Add {key.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1">
            {/* Groups */}
            {groups.map(group => (
              <GroupContainer
                key={group.id}
                group={group}
                elements={elements.filter(element => group.elements.includes(element.id))}
                onRemoveGroup={removeGroup}
                onToggleCollapse={toggleGroupCollapse}
                onUpdateGroupTitle={updateGroupTitle}
                selectedElements={selectedElements}
                onElementSelect={toggleElementSelection}
              />
            ))}

            {/* Ungrouped elements */}
            {elements
              .filter(element => !elementIsInGroup(element.id))
              .map(element => (
                <Element
                  key={element.id}
                  element={element}
                  isSelected={selectedElements.includes(element.id)}
                  onSelect={() => toggleElementSelection(element.id)}
                  onRemove={() => removeElement(element.id)}
                />
              ))}

            {/* JSON Schema */}
            <div className="bg-white rounded-lg shadow mt-6 p-4">
              <h2 className="text-xl font-semibold mb-4">JSON Schema</h2>
              <textarea
                value={jsonSchema}
                readOnly
                className="w-full h-64 p-2 font-mono text-sm border rounded"
              />
            </div>
          </div>
        </div>

        {/* Floating group actions */}
        <GroupActions
          selectedElements={selectedElements}
          onCreateGroup={createGroup}
        />
      </div>
    </div>
  );
};

export default JsonTemplateBuilderWithGroups;