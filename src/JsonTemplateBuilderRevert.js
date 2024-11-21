import React, { useState, useCallback, useEffect } from 'react';
import { PlusIcon, MinusIcon, TrashIcon, VariableIcon, MenuIcon, FolderPlusIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";

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
    ul: 'Unordered List (Bullet Points)',
    ol: 'Ordered List (Numbered List)',
    span: 'Span (Continuous Text)',
    strong: 'Strong (Bold Text)',
    br: 'Line Break'
  };
  return typeNames[type] || type.toUpperCase();
};

const FormattedInput = ({ value, onChange, placeholder, onRemove, onAddNestedSpan, onRemoveNestedSpan, onAddDescription }) => {
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  const handleSelect = (e) => {
    setSelectionStart(e.target.selectionStart);
    setSelectionEnd(e.target.selectionEnd);
  };

  const insertTag = (tag) => {
    const before = value.substring(0, selectionStart);
    const selection = value.substring(selectionStart, selectionEnd);
    const after = value.substring(selectionEnd);
    const newValue = `${before}<${tag}>${selection}</${tag}>${after}`;
    onChange(newValue);
  };

  const insertBreak = () => {
    const newValue = `${value}<br>`;
    onChange(newValue);
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelect}
        className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 h-16"
        placeholder={placeholder}
      />
      <div className="flex space-x-2 mb-2">
        <button onClick={() => insertTag('strong')} className="p-1 text-blue-500 hover:text-blue-700">
          <span className="font-bold">B</span>
        </button>
        <button onClick={() => insertTag('em')} className="p-1 text-blue-500 hover:text-blue-700">
          <span className="italic">I</span>
        </button>
        <button onClick={insertBreak} className="p-1 text-blue-500 hover:text-blue-700">
          <span>BR</span>
        </button>
        <button onClick={() => onChange(value + ' {{Group//Variable Name}}')} className="p-1 text-green-500 hover:text-green-700">
          <VariableIcon className="h-5 w-5" />
        </button>
        {onAddDescription && (
          <button onClick={onAddDescription} className="p-1 text-green-500 hover:text-green-700">
            Add Description
          </button>
        )}
        {onRemove && (
          <button onClick={onRemove} className="p-1 text-red-500 hover:text-red-700">
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
        {onAddNestedSpan && (
          <button onClick={onAddNestedSpan} className="p-1 text-purple-500 hover:text-purple-700">
            <PlusIcon className="h-5 w-5" />
          </button>
        )}
        {onRemoveNestedSpan && (
          <button onClick={onRemoveNestedSpan} className="p-1 text-red-500 hover:text-red-700">
            <MinusIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const ListItem = ({ item, index, elementId, modifyListItem, insertVariable, addNestedSpan, updateNestedSpan, removeNestedSpan }) => (
  <Draggable draggableId={item.id} index={index}>
    {(provided) => (
      <li
        className="mb-4 p-4 bg-gray-50 rounded-md flex items-start"
        ref={provided.innerRef}
        {...provided.draggableProps}
      >
        <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
          <MenuIcon className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex-1">
          <FormattedInput
            value={item.content}
            onChange={(value) => modifyListItem(elementId, item.id, 'content', value)}
            placeholder="List item content"
            onRemove={() => modifyListItem(elementId, item.id, 'removeContent')}
            onAddNestedSpan={() => addNestedSpan(elementId, item.id)}
          />
          <input
            value={item.description || ''}
            onChange={(e) => modifyListItem(elementId, item.id, 'description', e.target.value)}
            className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 h-8"
            placeholder="Item description"
          />
          {item.nestedSpans.map((span) => (
            <div key={span.id} className="mt-2 ml-4 p-2 bg-gray-100 rounded">
              <FormattedInput
                value={span.content}
                onChange={(value) => updateNestedSpan(elementId, item.id, span.id, 'content', value)}
                placeholder="Nested span content"
                onRemoveNestedSpan={() => removeNestedSpan(elementId, item.id, span.id)}
              />
              <input
                value={span.description || ''}
                onChange={(e) => updateNestedSpan(elementId, item.id, span.id, 'description', e.target.value)}
                className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2 h-8"
                placeholder="Nested span description"
              />
            </div>
          ))}
        </div>
      </li>
    )}
  </Draggable>
);

const Element = ({ element, index, updateElement, removeElement, modifyListItem, insertVariable, addNestedSpan, updateNestedSpan, removeNestedSpan, isSelected, onSelect }) => {
  const [showDescription, setShowDescription] = useState(!!element.description);

  return (
    <Draggable draggableId={element.id} index={index}>
      {(provided) => (
        <div
          className={`mb-6 relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between" {...provided.dragHandleProps}>
              <div className="flex items-center gap-4">
                <div className="absolute top-4 left-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={onSelect}
                  />
                </div>
                <CardTitle className="ml-10">{getElementTypeName(element.type)}</CardTitle>
              </div>
              <button onClick={() => removeElement(element.id)} className="text-red-500">
                <TrashIcon className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              {['ul', 'ol'].includes(element.type) && (
                <>
                  <label className="flex items-center mb-4 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={element.isDynamic}
                      onChange={(e) => updateElement(element.id, { isDynamic: e.target.checked })}
                      className="mr-2"
                    />
                    <span>Dynamic List</span>
                  </label>
                  {!element.isDynamic && (
                    <>
                      <textarea
                        value={element.description || ''}
                        onChange={(e) => updateElement(element.id, { description: e.target.value })}
                        className="w-full p-2 mb-4 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-16"
                        placeholder="List Description"
                      />
                      <Droppable droppableId={element.id} type="LIST">
                        {(provided) => {
                          const ListTag = element.type === 'ul' ? 'ul' : 'ol';
                          return (
                            <ListTag
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`pl-5 ${element.type === 'ul' ? 'list-disc' : 'list-decimal'}`}
                            >
                              {element.content.map((item, idx) => (
                                <ListItem
                                  key={item.id}
                                  item={item}
                                  index={idx}
                                  elementId={element.id}
                                  modifyListItem={modifyListItem}
                                  insertVariable={insertVariable}
                                  addNestedSpan={addNestedSpan}
                                  updateNestedSpan={updateNestedSpan}
                                  removeNestedSpan={removeNestedSpan}
                                />
                              ))}
                              {provided.placeholder}
                            </ListTag>
                          );
                        }}
                      </Droppable>
                      <button
                        onClick={() => modifyListItem(element.id, null, 'add')}
                        className="mt-4 flex items-center p-1 text-green-500 hover:text-green-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-1" /> Add Item
                      </button>
                    </>
                  )}
                </>
              )}
              {element.type === 'br' ? (
                <hr className="my-4 border-t border-gray-300" />
              ) : !['ul', 'ol', 'br'].includes(element.type) && (
                <>
                  <FormattedInput
                    value={element.content}
                    onChange={(value) => updateElement(element.id, { content: value })}
                    placeholder={`${getElementTypeName(element.type)} content`}
                    onAddDescription={() => setShowDescription(!showDescription)}
                  />
                  {showDescription && (
                    <textarea
                      value={element.description || ''}
                      onChange={(e) => updateElement(element.id, { description: e.target.value })}
                      placeholder="Description/Instructions for AI"
                      className="w-full p-2 mt-4 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-16"
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
};

const GroupContainer = ({ group, children, onRemoveGroup, onToggleCollapse, onUpdateGroupTitle }) => (
  <Card className="mb-6 border-l-4 border-blue-500">
    <CardHeader className="flex flex-row items-center justify-between bg-gray-50">
      <div className="flex items-center gap-2">
        <button onClick={() => onToggleCollapse(group.id)}>
          {group.isCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
        </button>
        <input
          type="text"
          value={group.title}
          onChange={(e) => onUpdateGroupTitle(group.id, e.target.value)}
          className="bg-transparent border-none focus:outline-none font-semibold"
        />
      </div>
      <button onClick={() => onRemoveGroup(group.id)} className="text-red-500">
        <TrashIcon className="h-4 w-4" />
      </button>
    </CardHeader>
    {!group.isCollapsed && <CardContent>{children}</CardContent>}
  </Card>
);

const JsonTemplateBuilder = () => {
  const [elements, setElements] = useState([]);
  const [selectedElements, setSelectedElements] = useState([]);
  const [groups, setGroups] = useState([]);
  const [jsonSchema, setJsonSchema] = useState('');

  // Group management
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